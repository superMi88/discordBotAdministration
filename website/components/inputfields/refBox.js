import React, { useRef, useEffect, useState } from "react";

export default function component(props) {

    function useOutsideAlerter(ref) {
        useEffect(() => {
          /**
           * Alert if clicked on outside of element
           */
          function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
              //alert("You clicked outside of me!");
              props.setOpen(false)
            }
          }

          const keyDownHandler = event => {
      
            if (event.key === 'Escape') {
              event.preventDefault();
      
              // your logic here
              props.setOpen(false)
            }
        }

          // Bind the event listener
          document.addEventListener("mousedown", handleClickOutside);
          document.addEventListener('keydown', keyDownHandler);
          return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener('keydown', keyDownHandler);
          };
        }, [ref]);
    }

    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef);

    return (
        <div ref={wrapperRef}>
            {props.children}
        </div>
    )
}
