import { useState, useEffect, useCallback } from "react";
import { getAllNovels } from "../services/novelService";
import {
  getUserNovelEntries,
  editUserNovelEntry,
  deleteUserNovelEntry,
  createUserNovelEntry,
} from "../services/userNovelService";

export function useNovelManager(token) {
  const [novels, setNovels] = useState([]);
  const [userEntries, setUserEntries] = useState({});
  const [loading, setLoading] = useState(true);
  // BUG 15 FIX: Surface auth errors so consumers can redirect to login
  const [authError, setAuthError] = useState(false);

  // ----------------------------
  // Fetch global novels + user novels
  // ----------------------------
  // BUG 16 FIX: Wrapped in useCallback so it can be safely listed in useEffect deps
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [novelsResult, entriesResult] = await Promise.allSettled([
        getAllNovels(),
        token ? getUserNovelEntries() : Promise.resolve([]),
      ]);
      if (novelsResult.status === "fulfilled") {
        setNovels(novelsResult.value);
      } else {
        console.error("Error refreshing novels:", novelsResult.reason);
      }

      if (entriesResult.status === "fulfilled") {
        const entries = entriesResult.value;
        const map = {};

        entries.forEach((entry) => {
          const novelId = entry.novelId;
          map[novelId] = entry;
        });

        setUserEntries(map);
      } else if (entriesResult.reason?.response?.status === 401) {
        setAuthError(true);
      } else {
        console.error("Error refreshing user entries:", entriesResult.reason);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ----------------------------
  // Create or update user novel
  // ----------------------------
  const saveEntry = async (novelId, payload) => {
    const existingEntry = userEntries[novelId];
    let res;

    if (existingEntry) {
      res = await editUserNovelEntry(
        existingEntry.id,
        payload
      );
    } else {
      res = await createUserNovelEntry(novelId, payload);
    }

    // res.novelId is the novel ID string on the entry — must NOT be in this chain.
    // POST returns { userNovel }, PATCH returns { updatedEntry }.
    const userEntry = res.userNovel ?? res.updatedEntry ?? res.entry ?? res;

    setUserEntries((prev) => ({
      ...prev,
      [novelId]: userEntry,
    }));

    return userEntry;
  };

  // ----------------------------
  // Delete user novel
  // ----------------------------
  const deleteEntry = async (userNovelId, novelId) => {
    await deleteUserNovelEntry(userNovelId);

    setUserEntries((prev) => {
      const updated = { ...prev };
      delete updated[novelId];
      return updated;
    });
  };

  return {
    novels,
    userEntries,
    loading,
    setLoading,
    saveEntry,
    deleteEntry,
    refreshData,
    authError,
  };
}
