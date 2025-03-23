import { useEffect, useState, useRef } from "react";
import { CheckoutPage } from "./CheckoutPage";

export const CheckoutModal = ({ isOpen, onClose, guide }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    const handleClickOutside = (event) => {
      if (event.target === dialog) {
        onClose();
      }
    };

    if (isOpen) {
      dialog.showModal();
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      dialog.close();
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
  };

  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      className="h-fit max-w-80 sm:max-w-md rounded-md bg-white"
      id="checkout-modal"
      ref={dialogRef}
      onClose={handleClose}
      onCancel={handleCancel}
    >
      <CheckoutPage onClose={handleClose} guide={guide} parentDialog={dialogRef.current} parentIsOpen={isOpen} />
    </dialog>
  );
};
