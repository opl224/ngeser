
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000 // Changed from 1000000 to 1000 (1 second)

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId();

  let dismissTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // The actual dispatch for dismissal
  const _internalDismissDispatch = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
  }

  // Function to be called to dismiss this toast, either manually or by timeout
  const dismissToast = () => {
    if (dismissTimeoutId) {
      clearTimeout(dismissTimeoutId);
      dismissTimeoutId = null;
    }
    _internalDismissDispatch();
  };
  
  // Schedule the auto-dismissal
  dismissTimeoutId = setTimeout(() => {
    dismissToast();
  }, 3000); // 3 seconds

  const updateToast = (updateProps: Partial<ToasterToast>) => { // Ensure updateProps type matches Partial<ToasterToast>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
    // Optional: If you want the timer to reset on update, uncomment below
    // if (dismissTimeoutId) clearTimeout(dismissTimeoutId);
    // dismissTimeoutId = setTimeout(dismissToast, 3000);
  };

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      // This onOpenChange is for the Toast component itself.
      // When the Toast component's internal state for 'open' changes to false (e.g., due to user clicking 'X'),
      // it will call this function. We need to ensure our programmatic dismiss (dismissToast) is called.
      onOpenChange: (open) => {
        if (!open) {
          // If the toast is closed by the component (e.g., user interaction),
          // ensure our programmatic dismiss logic (including timeout clearing) is run.
          dismissToast();
        }
      },
    },
  });

  return {
    id: id,
    dismiss: dismissToast, // Expose the dismiss function that clears the timeout
    update: updateToast,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
