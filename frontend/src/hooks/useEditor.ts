import { useState } from 'react';

/** Estado de um sheet de edição: fechado, criando (item = null) ou editando um item. */
export function useEditor<T>() {
  const [state, setState] = useState<{ open: boolean; item: T | null }>({ open: false, item: null });
  return {
    open: state.open,
    item: state.item,
    openNew: () => setState({ open: true, item: null }),
    openEdit: (item: T) => setState({ open: true, item }),
    // Mantém o item durante a animação de fechar para o conteúdo não "piscar".
    setOpen: (open: boolean) => setState((s) => ({ ...s, open })),
    close: () => setState((s) => ({ ...s, open: false })),
  };
}
