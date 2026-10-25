import React from "react";
import ReactDOM from "react-dom/client";
import { installStorageShim } from "./storageShim.js";
import EsportCareerGame from "./EsportCareerGame.jsx";
import "./index.css";

// Doit être installé avant que le jeu ne monte, puisqu'il appelle window.storage dès ses
// tout premiers effets (chargement du pseudo, des crédits, du Panthéon...).
installStorageShim();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <EsportCareerGame />
  </React.StrictMode>
);
