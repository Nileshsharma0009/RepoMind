import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';

const RepositoryContext = createContext(null);

export function RepositoryProvider({ children }) {
  const [connectedRepos, setConnectedRepos] = useState([]);
  const [activeRepoId, setActiveRepoId] = useState(localStorage.getItem('repomind_active_repo') || '');
  const [activeRepo, setActiveRepo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRepoLoading, setActiveRepoLoading] = useState(false);
  const pollTimerRef = useRef(null);

  // Fetch all connected repos for the user
  const fetchConnectedRepos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/repositories');
      setConnectedRepos(data.repositories || []);
    } catch (err) {
      console.error('Failed to load connected repositories:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch details of the active repo
  const fetchActiveRepoDetails = useCallback(async (repoId) => {
    if (!repoId) {
      setActiveRepo(null);
      return;
    }
    setActiveRepoLoading(true);
    try {
      const { data } = await api.get(`/repositories/${repoId}`);
      setActiveRepo(data.repository);
    } catch (err) {
      console.error('Failed to load repository details:', err.message);
      // Clear active repo if not found/error
      setActiveRepo(null);
      setActiveRepoId('');
      localStorage.removeItem('repomind_active_repo');
    } finally {
      setActiveRepoLoading(false);
    }
  }, []);

  // Connect a repo
  const connectRepo = async (githubRepo) => {
    try {
      const { data } = await api.post('/repositories', {
        githubId: githubRepo.githubId,
        name: githubRepo.name,
        fullName: githubRepo.fullName,
        description: githubRepo.description,
        owner: githubRepo.owner,
        url: githubRepo.url,
        defaultBranch: githubRepo.defaultBranch,
      });

      const newRepo = data.repository;
      setConnectedRepos((prev) => [newRepo, ...prev.filter((r) => r._id !== newRepo._id)]);
      selectRepo(newRepo._id);
      return newRepo;
    } catch (err) {
      console.error('Failed to connect repository:', err.message);
      throw err;
    }
  };

  // Disconnect a repo
  const disconnectRepo = async (repoId) => {
    try {
      await api.delete(`/repositories/${repoId}`);
      setConnectedRepos((prev) => prev.filter((r) => r._id !== repoId));
      if (activeRepoId === repoId) {
        selectRepo('');
      }
    } catch (err) {
      console.error('Failed to disconnect repository:', err.message);
      throw err;
    }
  };

  // Sync / Re-index a repo
  const syncRepo = async (repoId) => {
    try {
      const { data } = await api.post(`/repositories/${repoId}/sync`);
      const updatedRepo = data.repository;
      setConnectedRepos((prev) =>
        prev.map((r) => (r._id === repoId ? { ...r, status: 'indexing' } : r))
      );
      if (activeRepoId === repoId) {
        setActiveRepo(updatedRepo);
      }
      return updatedRepo;
    } catch (err) {
      console.error('Failed to synchronize repository:', err.message);
      throw err;
    }
  };

  // Change active repo
  const selectRepo = (repoId) => {
    setActiveRepoId(repoId);
    if (repoId) {
      localStorage.setItem('repomind_active_repo', repoId);
    } else {
      localStorage.removeItem('repomind_active_repo');
      setActiveRepo(null);
    }
  };

  // Load connected repos on mount
  useEffect(() => {
    fetchConnectedRepos();
  }, [fetchConnectedRepos]);

  // Load details whenever active ID changes
  useEffect(() => {
    fetchActiveRepoDetails(activeRepoId);
  }, [activeRepoId, fetchActiveRepoDetails]);

  // Background polling for repo status (indexing / connected)
  useEffect(() => {
    // Clear existing timer if any
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (activeRepo && (activeRepo.status === 'indexing' || activeRepo.status === 'connected')) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/repositories/${activeRepo._id}`);
          const repo = data.repository;
          
          if (repo) {
            // Update active repo details
            setActiveRepo(repo);
            // Update status in connected list
            setConnectedRepos((prev) =>
              prev.map((r) => (r._id === repo._id ? { ...r, status: repo.status } : r))
            );

            // If it finishes indexing or fails, stop polling
            if (repo.status === 'indexed' || repo.status === 'failed') {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        } catch (err) {
          console.error('Polling repo status failed:', err.message);
        }
      }, 3000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [activeRepo]);

  return (
    <RepositoryContext.Provider
      value={{
        connectedRepos,
        activeRepo,
        activeRepoId,
        loading,
        activeRepoLoading,
        fetchConnectedRepos,
        connectRepo,
        disconnectRepo,
        syncRepo,
        selectRepo,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

export default RepositoryContext;
