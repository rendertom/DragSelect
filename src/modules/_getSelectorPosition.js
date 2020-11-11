import '../types.js'
import { _getCursorPos, _getScroll } from './'

/**
 * Reliably returns the exact x,y,w,h positions of the selector element
 * @param {DSArea} area
 * @param {DSZoom} zoom
 * @param {{x: number, y: number}} initialScroll
 * @param {{x: number, y: number}} initialCursorPos
 * @param {DSEvent} [event]
 * @returns {{x:number,y:number,w:number,h:number}}
 */
export default (area, zoom, initialScroll, initialCursorPos, event) => {
  const cursorPosNew = _getCursorPos(area, zoom, event)
  const scrollNew = _getScroll(area)

  // if area or document is scrolled those values have to be included as well
  const scrollAmount = {
    x: scrollNew.x - initialScroll.x,
    y: scrollNew.y - initialScroll.y,
  }

  /** check for direction
   *
   * This is quite complicated, so also quite complicated to explain. Lemme’ try:
   *
   * Problem #1:
   * Sadly in HTML we can not have negative sizes.
   * so if we want to scale our element 10px to the right then it is easy,
   * we just have to add +10px to the width. But if we want to scale the element
   * -10px to the left then things become more complicated, we have to move
   * the element -10px to the left on the x axis and also scale the element
   * by +10px width to fake a negative sizing.
   *
   * One solution to this problem is using css-transforms scale() with
   * transform-origin of top left. BUT we can’t use this since it will size
   * everything, then when your element has a border for example, the border will
   * get inanely huge. Also transforms are not widely supported in IE.
   *
   * Example #1:
   * Unfortunately, things get even more complicated when we are inside a scroll-able
   * DIV. Then, let’s say we scroll to the right by 10px and move the cursor right by 5px in our
   * checks we have to subtract 10px from the initialcursor position in our check
   * (since the initial position is moved to the left by 10px) so in our example:
   * 1. cursorPosNew.x (5) > initialCursorPos.x (0) - scrollAmount.x (10) === 5 > -10 === true
   * then set the x position to the cursors start position
   * selectorPos.x = initialCursorPos.x (0) - scrollAmount.x (10) === 10 // 2.
   * then we can calculate the elements width, which is
   * the new cursor position minus the initial one plus the scroll amount, so in our example:
   * 3. selectorPos.w = cursorPosNew.x (5) - initialCursorPos.x (0) + scrollAmount.x (10) === 15;
   *
   * let’s say after that movement we now scroll 20px to the left and move our cursor by 30px to the left:
   * 1b. cursorPosNew.x (-30) > initialCursorPos.x (0) - scrollAmount.x (-20) === -30 < --20 === -30 < +20 === false;
   * 2b. selectorPos.x = cursorPosNew.x (-30) === -30; move left position to cursor (for more info see Problem #1)
   * 3b. selectorPos.w = initialCursorPos.x (0) - cursorPosNew.x (-30) - scrollAmount.x (-20) === 0--30--20 === 0+30+20 === 50;  // scale width to original left position (for more info see Problem #1)
   *
   * same thing has to be done for top/bottom
   *
   * I hope that makes sense. Try stuff out and play around with variables to get a hang of it.
   */
  const selectorPos = {}

  // right
  if (cursorPosNew.x > initialCursorPos.x - scrollAmount.x) { // 1.
    selectorPos.x = initialCursorPos.x - scrollAmount.x // 2.
    selectorPos.w = cursorPosNew.x - initialCursorPos.x + scrollAmount.x // 3.
    // left
  } else { // 1b.
    selectorPos.x = cursorPosNew.x // 2b.
    selectorPos.w = initialCursorPos.x - cursorPosNew.x - scrollAmount.x // 3b.
  }

  // bottom
  if (cursorPosNew.y > initialCursorPos.y - scrollAmount.y) {
    selectorPos.y = initialCursorPos.y - scrollAmount.y
    selectorPos.h = cursorPosNew.y - initialCursorPos.y + scrollAmount.y
    // top
  } else {
    selectorPos.y = cursorPosNew.y
    selectorPos.h = initialCursorPos.y - cursorPosNew.y - scrollAmount.y
  }

  return selectorPos
}
