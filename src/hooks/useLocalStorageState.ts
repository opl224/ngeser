
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// Define a consistent name for the custom event
const CUSTOM_LOCAL_STORAGE_EVENT_NAME = 'customLocalStorageChange';

function useLocalStorageState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Internal React state for this instance of the hook
  const [internalState, setInternalState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  // Wrapped setter function that updates React state, localStorage, and dispatches a custom event
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      // Determine the new value (handling function or direct value)
      const newValue = valueOrFn instanceof Function ? valueOrFn(internalState) : valueOrFn;
      
      // 1. Update internal React state for this hook instance
      setInternalState(newValue);

      // 2. Update localStorage and dispatch custom event (only if in browser context)
      if (typeof window !== 'undefined') {
        try {
          const serializedValue = JSON.stringify(newValue);
          window.localStorage.setItem(key, serializedValue);
          
          // 3. Dispatch custom event for other hook instances on the same page
          window.dispatchEvent(new CustomEvent(CUSTOM_LOCAL_STORAGE_EVENT_NAME, { 
            detail: { 
              key, 
              newValue: serializedValue // Pass the new value (serialized)
            } 
          }));
        } catch (error) {
          console.error(`Error setting localStorage key “${key}”:`, error);
        }
      }
    },
    [key, internalState] // `internalState` is needed if `valueOrFn` is a state update function
  );

  // Effect for listening to changes from:
  // 1. Other tabs/windows (via standard 'storage' event)
  // 2. Same tab, other hook instances (via custom 'customLocalStorageChange' event)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      let eventKey: string | null = null;
      let eventNewValueString: string | null = null;

      if (event instanceof StorageEvent) { // Standard 'storage' event (from other tabs)
        if (event.storageArea === window.localStorage) {
          eventKey = event.key;
          eventNewValueString = event.newValue;
        }
      } else if (event instanceof CustomEvent && event.type === CUSTOM_LOCAL_STORAGE_EVENT_NAME) { // Custom event (from same tab)
        if (event.detail && event.detail.key === key) {
          eventKey = event.detail.key;
          eventNewValueString = event.detail.newValue;
        }
      }

      if (eventKey === key) {
        // Get current state as string to compare, avoids unnecessary parsing/updates if values are deeply equal
        let currentSerializedState: string;
        try {
            currentSerializedState = JSON.stringify(internalState);
        } catch {
            // Fallback if internalState is not serializable, though it should be
            currentSerializedState = "__SERIALIZATION_ERROR__"; 
        }

        if (eventNewValueString === null) { // Item was removed or value explicitly set to null
          // Only update if current state is not already the default value (or its string equivalent)
          if (currentSerializedState !== JSON.stringify(defaultValue)) {
            setInternalState(defaultValue);
          }
        } else {
          // Only update if the new serialized value is different from the current serialized state
          if (currentSerializedState !== eventNewValueString) {
            try {
              setInternalState(JSON.parse(eventNewValueString));
            } catch (error) {
              console.error(`Error parsing localStorage key “${key}” on change:`, error);
              // Fallback to default if parsing fails and current state is not already default
              if (currentSerializedState !== JSON.stringify(defaultValue)) {
                setInternalState(defaultValue);
              }
            }
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener(CUSTOM_LOCAL_STORAGE_EVENT_NAME, handleStorageChange as EventListener);

    // Cleanup: remove event listeners when the component unmounts or dependencies change
    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener(CUSTOM_LOCAL_STORAGE_EVENT_NAME, handleStorageChange as EventListener);
    };
  }, [key, defaultValue, internalState]); // internalState is included to ensure comparisons are with the latest state

  return [internalState, setValue];
}

export default useLocalStorageState;
