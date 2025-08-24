import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";

interface CleanupResult {
  duplicatesSong: number;
  duplicatesArtist: number;
  duplicatesAlbum: number;
  orphanedPlayEvents: number;
  inconsistencies: string[];
  totalRecordsProcessed: number;
  executionTime: number;
}

interface WorkerProgress {
  phase: 'idle' | 'initializing' | 'songs' | 'artists' | 'albums' | 'orphans' | 'consistency' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
}

interface WorkerStatus {
  success: boolean;
  isRunning: boolean;
  progress: WorkerProgress;
  result?: CleanupResult;
  error?: string;
}

export async function loader() {
  // Get initial worker status
  try {
    const response = await fetch(`/api/cleanup?action=status`);
    const status = await response.json();
    return json({ initialStatus: status });
  } catch (error) {
    return json({
      initialStatus: {
        success: true,
        isRunning: false,
        progress: {
          phase: 'idle',
          current: 0,
          total: 0,
          message: 'Ready to start cleanup'
        }
      }
    });
  }
}

export default function CleanupPage() {
  const { initialStatus } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<WorkerStatus>(initialStatus);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for status updates when worker is running
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status.isRunning && !isPolling) {
      setIsPolling(true);
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/cleanup?action=status');
          const newStatus = await response.json();
          setStatus(newStatus);

          // Stop polling when worker is done
          if (!newStatus.isRunning) {
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Failed to fetch status:', error);
          setIsPolling(false);
        }
      }, 1000); // Poll every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.isRunning, isPolling]);

  const startCleanup = async () => {
    try {
      const response = await fetch('/api/cleanup?start=true', {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        // Start polling immediately
        setStatus(prev => ({ ...prev, isRunning: true }));
      } else {
        setStatus(prev => ({
          ...prev,
          error: result.message || 'Failed to start cleanup'
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start cleanup'
      }));
    }
  };

  const stopCleanup = async () => {
    try {
      const response = await fetch('/api/cleanup?action=stop');
      const result = await response.json();

      if (result.success) {
        setStatus(prev => ({
          ...prev,
          isRunning: false,
          progress: {
            phase: 'idle',
            current: 0,
            total: 0,
            message: 'Cleanup stopped by user'
          }
        }));
        setIsPolling(false);
      }
    } catch (error) {
      console.error('Failed to stop cleanup:', error);
    }
  };

  const getPhaseDescription = (phase: WorkerProgress['phase']) => {
    switch (phase) {
      case 'idle': return 'Ready to start';
      case 'initializing': return 'Preparing cleanup process';
      case 'songs': return 'Deduplicating songs';
      case 'artists': return 'Deduplicating artists';
      case 'albums': return 'Deduplicating albums';
      case 'orphans': return 'Cleaning orphaned play events';
      case 'consistency': return 'Checking for inconsistencies';
      case 'completed': return 'Cleanup completed';
      case 'error': return 'Error occurred';
      default: return 'Processing';
    }
  };

  const progressPercentage = status.progress.total > 0
    ? Math.round((status.progress.current / status.progress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Database Cleanup
            </h1>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This tool will help you clean up your music database by:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Deduplicating songs with similar titles by the same artist</li>
                <li>Merging duplicate artists (e.g., &quot;A-ha&quot; and &quot;AHA&quot;)</li>
                <li>Consolidating duplicate albums</li>
                <li>Removing orphaned play events</li>
                <li>Identifying other database inconsistencies</li>
              </ul>
            </div>

            {/* Worker Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  Status: {getPhaseDescription(status.progress.phase)}
                </h3>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  status.isRunning
                    ? 'bg-blue-100 text-blue-800'
                    : status.progress.phase === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : status.progress.phase === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {status.isRunning ? 'Running' :
                   status.progress.phase === 'completed' ? 'Completed' :
                   status.progress.phase === 'error' ? 'Error' : 'Idle'}
                </div>
              </div>

              {status.progress.total > 0 && (
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">{status.progress.message}</p>
            </div>

            {/* Control Buttons */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={startCleanup}
                disabled={status.isRunning}
                className={`px-4 py-2 rounded-md font-medium ${
                  status.isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {status.isRunning ? 'Cleanup Running...' : 'Start Cleanup'}
              </button>

              {status.isRunning && (
                <button
                  onClick={stopCleanup}
                  className="px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700"
                >
                  Stop Cleanup
                </button>
              )}
            </div>

            {/* Error Display */}
            {status.error && (
              <div className="mb-6 bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{status.error}</p>
              </div>
            )}

            {/* Results Display */}
            {status.result && status.progress.phase === 'completed' && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">
                  Cleanup Results
                </h2>

                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {status.result.duplicatesSong}
                      </div>
                      <div className="text-sm text-blue-600">Duplicate Songs</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {status.result.duplicatesArtist}
                      </div>
                      <div className="text-sm text-green-600">Duplicate Artists</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {status.result.duplicatesAlbum}
                      </div>
                      <div className="text-sm text-purple-600">Duplicate Albums</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {status.result.orphanedPlayEvents}
                      </div>
                      <div className="text-sm text-red-600">Orphaned Events</div>
                    </div>
                  </div>

                  {/* Inconsistencies */}
                  {status.result.inconsistencies && status.result.inconsistencies.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        Database Inconsistencies Found
                      </h3>
                      <ul className="list-disc list-inside text-yellow-700 space-y-1">
                        {status.result.inconsistencies.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Execution Info */}
                  <div className="text-sm text-gray-500">
                    <div>Total records processed: {status.result.totalRecordsProcessed.toLocaleString()}</div>
                    <div>Execution time: {(status.result.executionTime / 1000).toFixed(2)}s</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
