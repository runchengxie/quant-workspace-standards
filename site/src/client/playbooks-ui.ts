export function initPlaybooks(message: (key: string) => string): void {
  const stages = [...document.querySelectorAll<HTMLElement>("[data-stage]")];
  const phaseButtons = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-phase]"),
  ];

  function selectPhase(name: string): void {
    stages.forEach((stage) => {
      stage.hidden = stage.dataset["stage"] !== name;
    });
    phaseButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset["phase"] === name),
      );
    });
    document.getElementById("copy-status")?.replaceChildren();
  }

  if (stages.length) {
    const controls = document.querySelector<HTMLElement>(".prompt-switch");
    if (controls) controls.hidden = false;
    selectPhase("code");
    phaseButtons.forEach((button) =>
      button.addEventListener("click", () =>
        selectPhase(button.dataset["phase"] ?? "code"),
      ),
    );
  }

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) =>
    button.addEventListener("click", async () => {
      const content = document.getElementById(button.dataset["copy"] ?? "");
      const status = document.getElementById("copy-status");
      if (!content || !status) return;
      try {
        await navigator.clipboard.writeText(content.textContent ?? "");
        status.textContent = message("copied");
      } catch {
        const disclosure = content.closest<HTMLDetailsElement>("details");
        if (disclosure) disclosure.open = true;
        const range = document.createRange();
        range.selectNodeContents(content);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        status.textContent = message("copyFallback");
      }
    }),
  );
}
