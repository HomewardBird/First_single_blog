let isReaderMode = false;

const emitReaderModeChangeEvent = (mode: "on" | "off") => {
  const event: CustomEventMap["readermodechange"] = new CustomEvent("readermodechange", {
    detail: { mode },
  });
  document.dispatchEvent(event);
};

const setupReaderMode = () => {
  const switchReaderMode = () => {
    isReaderMode = !isReaderMode;
    const newMode = isReaderMode ? "on" : "off";
    document.documentElement.setAttribute("reader-mode", newMode);
    emitReaderModeChangeEvent(newMode);
  };

  for (const readerModeButton of document.getElementsByClassName("readermode")) {
    readerModeButton.addEventListener("click", switchReaderMode);
    window.addCleanup(() => readerModeButton.removeEventListener("click", switchReaderMode));
  }

  // Set initial state
  document.documentElement.setAttribute("reader-mode", isReaderMode ? "on" : "off");
};

document.addEventListener("nav", setupReaderMode);
document.addEventListener("render", setupReaderMode);
