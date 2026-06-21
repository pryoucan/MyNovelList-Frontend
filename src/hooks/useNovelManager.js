import { useState, useEffect, useCallback, useRef } from "react";
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
  const isInitialLoad = useRef(true);

  // ----------------------------
  // Fetch global novels + user novels
  // ----------------------------
  // BUG 16 FIX: Wrapped in useCallback so it can be safely listed in useEffect deps
  const refreshData = useCallback(async () => {
    setLoading(true);
    const grace = isInitialLoad.current
      ? new Promise((r) => setTimeout(r, 600))
      : Promise.resolve();
    isInitialLoad.current = false;
    try {
      const [globalNovels] = await Promise.all([getAllNovels(), grace]);
      setNovels(globalNovels);

      if (token) {
        const entries = await getUserNovelEntries(token);
        const map = {};

        entries.forEach((entry) => {
          const novelId = entry.novel;
          map[novelId] = entry;
        });

        setUserEntries(map);
      } else {
        setUserEntries({});
      }
    } catch (error) {
      // BUG 15 FIX: Detect expired/invalid token and signal to consumer
      if (error.response?.status === 401) {
        setAuthError(true);
      } else {
        console.error("Error refreshing data:", error);
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
        existingEntry._id,
        payload,
        token
      );
    } else {
      res = await createUserNovelEntry(novelId, payload, token);
    }

    // res.novel is the novel ID string on the entry — must NOT be in this chain.
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
    await deleteUserNovelEntry(userNovelId, token);

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
