'use strict';
(function (window, document) {
  var cachScreenHeight = 300;

  function querySelector(query) {
    return document.querySelector(query);
  }

  function queryPromise(query, delay, time) {
    var counterTimeout = time || 23;
    return new Promise(function (resolve, reject) {
      var queryTimmerParent;
      function resolveQuery(queryTimmer) {
        var el = querySelector(query);
        clearTimeout(queryTimmer);
        if (el) {
          resolve(el);
        } else {
          if (counterTimeout < 0) {
            reject('Query Timeout for query ' + query);
          } else {
            queryTimmerParent = setTimeout(function () {
              counterTimeout -= 1;
              resolveQuery(queryTimmerParent);
            }, delay || 123);
          }
        }
      }
      resolveQuery();
    });
  }

  function sumOffset(elem, offsetKey) {
    var sum = 0;
    do {
      if (!isNaN(elem[offsetKey])) {
        sum += elem[offsetKey];
      }
    } while (elem = elem.offsetParent);
    return sum;
  }

  function getSelectionRect() {
    var selection = window.getSelection();
    var selectedStr = selection.toString();
    if (typeof selectedStr === 'string' && (/\s+$/.test(selectedStr) || !selectedStr)) {
      return false;
    }
    var clientRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    if (selection.rangeCount) {
      var range = selection.getRangeAt(0).cloneRange();
      if (range.getBoundingClientRect) {
        var rect = range.getBoundingClientRect();
        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;
        Object.assign(clientRect, { width: width, height: height, top: rect.top, left: rect.left });
      }
    }
    if (selection.focusNode.parentElement) {
      var pageY = sumOffset(selection.focusNode.parentElement, 'offsetTop');
      var pageX = sumOffset(selection.focusNode.parentElement, 'offsetLeft');
      Object.assign(clientRect, { x: pageX, y: pageY });
    }
    return clientRect;
  }

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function handleLookupEvent(event) {
    var targetRect = getSelectionRect();
    if (!targetRect) {
      return;
    }
    queryPromise('#gtx-trans').then(function (trans) {
      var selectionOffset = targetRect.height || 14;
      var clientY = targetRect.top;
      var pageY = targetRect.y;
      var shouldRenderBelow = clientY < cachScreenHeight;
      if (shouldRenderBelow) {
        Object.assign(trans.style, { top: (selectionOffset + pageY) + 'px' });
      } else {
        Object.assign(trans.style, { top: (pageY - selectionOffset) + 'px' });
      }
      trans.addEventListener('click', function () {
        /* change translate anchor position */
        queryPromise('#gtx-anchor').then(function (anchor) {
          Object.assign(anchor.style, { top: (pageY) + 'px' });
          /* process change position of google translate popup */
          queryPromise('.jfk-bubble.gtx-bubble').then(function (bubble) {
            if (shouldRenderBelow) {
              Object.assign(bubble.style, { top: (selectionOffset + pageY) + 'px' });
            } else {
              var popupRect = bubble.getBoundingClientRect();
              Object.assign(bubble.style, { top: (pageY - popupRect.height) + 'px' });
            }
            /* change direction of translate arrow */
            queryPromise('.jfk-bubble-arrow-id.jfk-bubble-arrow', 23).then(function (arrowDirection) {
              var up = 'jfk-bubble-arrowup';
              var down = 'jfk-bubble-arrowdown';
              if (shouldRenderBelow) {
                arrowDirection.classList.add(up);
                arrowDirection.classList.remove(down)
              } else {
                arrowDirection.classList.add(down)
                arrowDirection.classList.remove(up);
              }
            }).catch(console.warn);
          }).catch(console.warn);
        }).catch(function (resonse) {
          console.warn(resonse);
        });
      });
    }).catch(function (resonse) {
      console.warn(resonse);
    });
  }

  var handleEventWithDebounce = debounce(function (event) {
    handleLookupEvent(event);
  }, 350);

  document.addEventListener('selectionchange', handleEventWithDebounce);

})(window, document);