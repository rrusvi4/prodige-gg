// Remplace l'API window.storage propre à l'environnement Claude par une implémentation
// équivalente basée sur le localStorage du navigateur — même surface d'API (get/set/delete/list),
// donc tout le reste du jeu (EsportCareerGame.jsx) fonctionne sans aucune autre modification.
//
// Le jeu n'utilise jamais le mode "partagé" (shared: true) — tout est déjà personnel par
// appareil, ce qui correspond exactement à ce que fait le localStorage.

const NAMESPACE = "prodige-gg:";

function fullKey(key) {
  return NAMESPACE + key;
}

function makeStorage() {
  return {
    async get(key, _shared = false) {
      const raw = window.localStorage.getItem(fullKey(key));
      if (raw === null) {
        // Reproduit le comportement documenté de l'API Claude : une clé absente lève une
        // erreur plutôt que de renvoyer null. Tout le jeu attrape déjà ce cas via try/catch.
        throw new Error(`Clé introuvable : ${key}`);
      }
      return { key, value: raw, shared: false };
    },

    async set(key, value, _shared = false) {
      window.localStorage.setItem(fullKey(key), value);
      return { key, value, shared: false };
    },

    async delete(key, _shared = false) {
      window.localStorage.removeItem(fullKey(key));
      return { key, deleted: true, shared: false };
    },

    async list(prefix = "", _shared = false) {
      const keys = [];
      const fullPrefix = fullKey(prefix);
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) {
          keys.push(k.slice(NAMESPACE.length));
        }
      }
      return { keys, prefix, shared: false };
    },
  };
}

export function installStorageShim() {
  if (typeof window !== "undefined" && !window.storage) {
    window.storage = makeStorage();
  }
}
