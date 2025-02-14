import { useEffect, useRef } from "react";
import { CheckoutPage } from "./CheckoutPage";

export const CheckoutModal = ({ isOpen, onClose }) => {
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
      className="h-fit max-w-80 rounded-md bg-zinc-700 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(125,109,148,0.3),rgba(255,255,255,0))]"
      id="checkout-modal"
      ref={dialogRef}
      onClose={handleClose}
      onCancel={handleCancel}
    >
      <CheckoutPage onClose={handleClose} />
    </dialog>
  );
};
