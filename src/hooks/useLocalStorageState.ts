
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// Define a consistent name for the custom event
const CUSTOM_LOCAL_STORAGE_EVENT_NAME = 'customLocalStorageChange';

function useLocalStorageState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [internalState, setInternalState] = useState<T>(defaultValue); 
  const [hasMounted, setHasMounted] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) { // Check if value actually exists
          setInternalState(JSON.parse(storedValue));
        }
        // If storedValue is null, internalState remains defaultValue, which is correct.
      } catch (error) {
        console.error(`Error reading localStorage key “${key}”:`, error);
        // If error, state remains defaultValue
      }
    }
  }, [key]); // Effect runs once after mount, or if key changes (though key shouldn't change for this hook)

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      // Determine the new value (handling function or direct value)
      // Important: Pass the most current internalState to the function if it's a function
      const newValue = valueOrFn instanceof Function ? valueOrFn(internalState) : valueOrFn;
      
      setInternalState(newValue);

      if (hasMounted && typeof window !== 'undefined') { // Only update localStorage if mounted
        try {
          const serializedValue = JSON.stringify(newValue);
          window.localStorage.setItem(key, serializedValue);
          
          window.dispatchEvent(new CustomEvent(CUSTOM_LOCAL_STORAGE_EVENT_NAME, { 
            detail: { 
              key, 
              newValue: serializedValue 
            } 
          }));
        } catch (error) {
          console.error(`Error setting localStorage key “${key}”:`, error);
        }
      }
    },
    [key, internalState, hasMounted] 
  );

  useEffect(() => {
    if (!hasMounted || typeof window === 'undefined') { // Only listen to events if mounted
      return;
    }

    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      let eventKey: string | null = null;
      let eventNewValueString: string | null = null;

      if (event instanceof StorageEvent) { 
        if (event.storageArea === window.localStorage) {
          eventKey = event.key;
          eventNewValueString = event.newValue;
        }
      } else if (event instanceof CustomEvent && event.type === CUSTOM_LOCAL_STORAGE_EVENT_NAME) { 
        if (event.detail && event.detail.key === key) {
          eventKey = event.detail.key;
          eventNewValueString = event.detail.newValue;
        }
      }

      if (eventKey === key) {
        let currentSerializedState: string;
        try {
            currentSerializedState = JSON.stringify(internalState);
        } catch {
            currentSerializedState = "__SERIALIZATION_ERROR__"; 
        }

        if (eventNewValueString === null) { 
          if (currentSerializedState !== JSON.stringify(defaultValue)) {
            setInternalState(defaultValue);
          }
        } else {
          if (currentSerializedState !== eventNewValueString) {
            try {
              setInternalState(JSON.parse(eventNewValueString));
            } catch (error) {
              console.error(`Error parsing localStorage key “${key}” on change:`, error);
              if (currentSerializedState !== JSON.stringify(defaultValue)) {
                setInternalState(defaultValue);
              }
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener(CUSTOM_LOCAL_STORAGE_EVENT_NAME, handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener(CUSTOM_LOCAL_STORAGE_EVENT_NAME, handleStorageChange as EventListener);
    };
  }, [key, defaultValue, internalState, hasMounted]);

  return [internalState, setValue];
}

export default useLocalStorageState;
