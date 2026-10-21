import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function nonFencedLines(source) {
  const lines = source.split(/\r?\n/);
  const visible = [];
  let fence = null;

  for (const line of lines) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      const closing = new RegExp(`^ {0,3}${fence.character}{${fence.length},}\\s*$`);
      if (closing.test(line)) fence = null;
      visible.push("");
      continue;
    }
    if (marker) {
      fence = { character: marker[1][0], length: marker[1].length };
      visible.push("");
      continue;
    }
    visible.push(line);
  }

  return visible;
}

function visibleLines(source) {
  return nonFencedLines(source).map(line => line.replace(/(`+)(.*?)\1/g, ""));
}

function matchingBracket(text, start, opening, closing) {
  let depth = 1;
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === "\\") {
      index += 1;
      continue;
    }
    if (text[index] === opening) depth += 1;
    if (text[index] === closing && --depth === 0) return index;
  }
  return -1;
}

function linkDestination(contents) {
  const input = contents.trimStart();
  if (!input) return "";
  if (input[0] === "<") {
    const end = input.indexOf(">");
    return end < 0 ? "" : input.slice(1, end);
  }

  let depth = 0;
  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === "\\") {
      index += 1;
      continue;
    }
    if (input[index] === "(") depth += 1;
    if (input[index] === ")" && depth > 0) depth -= 1;
    if (/\s/.test(input[index]) && depth === 0) return input.slice(0, index);
  }
  return input;
}

export function extractMarkdownLinks(source) {
  const lines = visibleLines(source);
  const links = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const definition = line.match(/^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/);
    if (definition) {
      const destination = linkDestination(definition[1]);
      if (destination) links.push({ destination, line: index + 1 });
      continue;
    }

    for (let cursor = 0; cursor < line.length; cursor += 1) {
      if (line[cursor] === "\\") {
        cursor += 1;
        continue;
      }
      if (line[cursor] !== "[") continue;

      const labelEnd = matchingBracket(line, cursor, "[", "]");
      if (labelEnd < 0 || line[labelEnd + 1] !== "(") continue;
      const destinationEnd = matchingBracket(line, labelEnd + 1, "(", ")");
      if (destinationEnd < 0) continue;

      const destination = linkDestination(line.slice(labelEnd + 2, destinationEnd))
        .replace(/\\([!"#$%&'()*+,\-./:;<=>?@\[\]^_`{|}~])/g, "$1");
      if (destination) links.push({ destination, line: index + 1 });
      cursor = destinationEnd;
    }
  }

  return links;
}

function headingSlug(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/`/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function markdownHeadings(source) {
  const lines = nonFencedLines(source);
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const atx = lines[index].match(/^ {0,3}#{1,6}(?:[ \t]+|$)(.*?)\s*#*\s*$/);
    if (atx) headings.push(atx[1]);
    else if (lines[index].trim() && /^ {0,3}(=+|-+)\s*$/.test(lines[index + 1] ?? ""))
      headings.push(lines[index].trim());
  }

  const used = new Set();
  const anchors = new Set();
  for (const heading of headings) {
    const base = headingSlug(heading);
    if (!base) continue;
    let candidate = base;
    let suffix = 0;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    used.add(candidate);
    anchors.add(candidate);
  }
  return anchors;
}

function markdownFiles(directory, root = directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) found.push(...markdownFiles(path, root));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md")
      found.push(relative(root, path).split(sep).join("/"));
  }
  return found;
}

function isInside(root, target) {
  const rel = relative(root, target);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

export function checkMarkdownLinks(repositoryRoot, files) {
  const root = realpathSync(repositoryRoot);
  const content = new Map();
  const headings = new Map();
  const errors = [];

  for (const sourceFile of files) {
    const absolute = resolve(root, sourceFile);
    if (!isInside(root, absolute)) {
      errors.push(`${sourceFile}: source file is outside the repository`);
      continue;
    }
    const source = readFileSync(absolute, "utf8");
    content.set(absolute, source);
    headings.set(absolute, markdownHeadings(source));
  }

  for (const sourceFile of files) {
    const sourcePath = resolve(root, sourceFile);
    if (!content.has(sourcePath)) continue;
    for (const { destination, line } of extractMarkdownLinks(content.get(sourcePath))) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) continue;

      const hashIndex = destination.indexOf("#");
      const queryIndex = destination.indexOf("?");
      const pathEnd = [hashIndex, queryIndex].filter(index => index >= 0).sort((a, b) => a - b)[0] ?? destination.length;
      const rawPath = destination.slice(0, pathEnd);
      const fragment = hashIndex < 0 ? "" : destination.slice(hashIndex + 1).split("?")[0];
      let targetPath;
      let decodedFragment;
      try {
        targetPath = decodeURIComponent(rawPath);
        decodedFragment = decodeURIComponent(fragment);
      } catch {
        errors.push(`${sourceFile}:${line}: invalid URL escape in '${destination}'`);
        continue;
      }

      const target = targetPath.startsWith("/")
        ? resolve(root, `.${targetPath}`)
        : targetPath
          ? resolve(dirname(sourcePath), targetPath)
          : sourcePath;
      const relativeTarget = relative(root, target).split(sep).join("/");
      if (!isInside(root, target)) {
        errors.push(`${sourceFile}:${line}: local target escapes the repository: '${destination}'`);
        continue;
      }
      if (!existsSync(target)) {
        errors.push(`${sourceFile}:${line}: missing local target '${destination}'`);
        continue;
      }

      const canonicalTarget = realpathSync(target);
      if (!isInside(root, canonicalTarget)) {
        errors.push(`${sourceFile}:${line}: local target resolves outside the repository: '${destination}'`);
        continue;
      }

      if (decodedFragment && extname(canonicalTarget).toLowerCase() === ".md") {
        const targetSource = content.get(canonicalTarget) ?? readFileSync(canonicalTarget, "utf8");
        const targetHeadings = headings.get(canonicalTarget) ?? markdownHeadings(targetSource);
        if (!targetHeadings.has(decodedFragment))
          errors.push(`${sourceFile}:${line}: missing heading '#${decodedFragment}' in '${relativeTarget}'`);
      }
    }
  }

  return errors;
}

export function documentationFiles(repositoryRoot) {
  // Rendered prose uses built-site URLs; artifact checks validate those links.
  const sourceDocs = markdownFiles(resolve(repositoryRoot, "docs"), repositoryRoot)
    .filter(path => !path.replaceAll("\\", "/").startsWith("docs/content/"));
  return [...sourceDocs, ...["README.md", "README.zh-CN.md"]
    .filter(path => existsSync(resolve(repositoryRoot, path)))];
}

function run() {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const files = documentationFiles(repositoryRoot);
  const errors = checkMarkdownLinks(repositoryRoot, files);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  const linkCount = files.reduce(
    (total, file) => total + extractMarkdownLinks(readFileSync(resolve(repositoryRoot, file), "utf8")).length,
    0,
  );
  console.log(`Checked ${linkCount} local Markdown links in ${files.length} docs file(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
