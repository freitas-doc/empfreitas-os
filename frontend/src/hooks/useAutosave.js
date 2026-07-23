import { useEffect, useRef } from 'react';
import { useOSForm } from '../context/OSFormContext.jsx';
import { api } from '../services/api.js';
import { indexedDbService } from '../services/indexedDbService.js';
import { AUTOSAVE_DEBOUNCE_MS } from '../utils/constants.js';

export default function useAutosave() {
  const { state, dispatch } = useOSForm();
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.id || state.status !== 'RASCUNHO') return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          ...state,
          dados_formulario_json: JSON.stringify(state)
        };

        // 1. Salva no IndexedDB (sempre funciona)
        await indexedDbService.salvarOrdem(payload);

        // 2. Tenta salvar no backend local via PUT
        try {
          await api.ordens.atualizar(state.id, payload);
        } catch (backendError) {
          console.warn('Backend indisponível no momento. Rascunho salvo localmente (Offline mode).', backendError);
        }

        dispatch({ type: 'MARCAR_SINCRONIZADO' });
      } catch (err) {
        console.error('Erro no autosave:', err);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutRef.current);
  }, [state, dispatch]);
}
