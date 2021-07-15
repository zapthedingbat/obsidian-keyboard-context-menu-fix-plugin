import { Plugin, Editor, MarkdownView, Menu } from "obsidian";

function getSpellcheckStatus(
  e: MouseEvent,
  position: CodeMirror.Position
): void {
  const prototype = Object.getPrototypeOf(this);
  if (e.target.tagName === "TEXTAREA") {
    // Get the element under the textarea
    e.target.style.visibility = "hidden";
    const clickedElement = e.target.ownerDocument.elementFromPoint(
      e.clientX,
      e.clientY
    );
    e.target.style.visibility = "visible";
    // Swap out the event with the target of the element under the textarea
    const newEvent = Object.assign({}, e, { target: clickedElement });
    return prototype.getSpellcheckStatus.call(this, newEvent, position);
  }
  return prototype.getSpellcheckStatus.call(this, e, position);
}

const isFixed = Symbol("Spell check fix has been applied");

export default class MyPlugin extends Plugin {
  onload() {
    this.app.workspace.on("active-leaf-change", (leaf) => {
      const editor = leaf.view.editor;
      if (editor && !editor[isFixed]) {
        editor.getSpellcheckStatus = getSpellcheckStatus;
        editor[isFixed] = true;
      }
    });

    this.app.workspace.on(
      "editor-menu",
      (menu: Menu, editor: Editor, view: MarkdownView) => {
        const onload = menu.onload;
        let menuItemElements: Element[];
        const handleMenuKeyDown = (e: KeyboardEvent) => {
          let index, nextIndex, nextItem;
          switch (e.key) {
            case "Enter":
              e.target.click();
              editor.focus();
              e.preventDefault();
              break;
            case "ArrowUp":
              // Find the currently selected item.
              index = menuItemElements.findIndex((el) => el === e.target);
              if (typeof index === "undefined") {
                return;
              }
              nextIndex = index === 0 ? menuItemElements.length - 1 : index - 1;
              nextItem = menuItemElements[nextIndex];
              nextItem.focus();
              break;
            case "ArrowDown":
              index = menuItemElements.findIndex((el) => el === e.target);
              if (typeof index === "undefined") {
                return;
              }
              nextIndex = (index + 1) % menuItemElements.length;
              nextItem = menuItemElements[nextIndex];
              nextItem.focus();
              break;
            case "Escape":
              menu.hide();
              editor.focus();
              e.preventDefault();
              break;
          }
        };

        menu.onload = (...args) => {
          const result = onload.apply(menu, args);
          menuItemElements = Array.from(
            menu.dom.querySelectorAll(
              ".menu-item:not(.is-disabled):not(.is-label)"
            )
          );
          menuItemElements.forEach((menuItemElement) => {
            menuItemElement.tabIndex = 0;
            menuItemElement.addEventListener("keydown", handleMenuKeyDown);
          });
          if (menuItemElements.length > 0) {
            menuItemElements[0].focus();
          }
          return result;
        };
      }
    );
  }
}
