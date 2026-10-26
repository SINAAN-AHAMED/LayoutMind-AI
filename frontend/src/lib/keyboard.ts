/** Modal dialogs and text fields own keyboard input before the room editor. */
export function editorKeyBlocked(event:Pick<KeyboardEvent,'target'|'defaultPrevented'>){
 return event.defaultPrevented||!!document.querySelector('[aria-modal="true"]')||
  (event.target instanceof Element&&!!event.target.closest('input,textarea,select,[contenteditable="true"]'))
}
