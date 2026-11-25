import React, { useEffect, useState } from 'react';
import { AlertCircle, GitBranch, RefreshCw } from 'lucide-react';
import type { GitCredentialHelper, GitSigningConfig, GitStatus } from '../../types/projectActions';
import {
  commitGitChanges,
  configureGitSigning,
  connectGitRemote,
  disconnectGitRemote,
  fetchGitStatus,
  initializeGit,
  pullGitChanges,
  pushGitChanges,
  saveGitAuthentication,
  stageGitChanges,
} from '../../services/projectActionsClient';
import { ConfirmDialog } from '../controls/ConfirmDialog';

interface Confirmation {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<GitStatus>;
}

const fieldClass = 'w-full rounded border border-[#343B43] bg-[#101214] px-3 py-2 text-[12px] text-[#F1F3F5]';
const actionClass = 'rounded border border-[#343B43] bg-[#252A30] px-3 py-2 text-[11px] text-[#F1F3F5] hover:border-[#C7A46A] disabled:opacity-50';

export const ProjectGitPanel: React.FC<{ directory: string; label?: string }> = ({ directory, label }) => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [credentialHelper, setCredentialHelper] = useState<GitCredentialHelper>('manager');
  const [signing, setSigning] = useState<GitSigningConfig>({
    name: '',
    email: '',
    enabled: false,
    format: 'openpgp',
    signingKey: '',
  });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchGitStatus(directory));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Git status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [directory]);

  const perform = async (action: () => Promise<GitStatus>, successText: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      setStatus(await action());
      setMessage(successText);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Git operation failed.');
    } finally {
      setLoading(false);
      setConfirmation(null);
    }
  };

  const ask = (
    title: string,
    description: string,
    confirmLabel: string,
    action: () => Promise<GitStatus>
  ) => setConfirmation({ title, description, confirmLabel, action });

  const saveSigning = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { status: nextStatus } = await configureGitSigning(directory, signing);
      setStatus(nextStatus);
      setMessage(signing.enabled ? 'Git identity and commit signing were configured.' : 'Git identity was configured; commit signing is disabled.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to configure Git signing.');
    } finally {
      setLoading(false);
    }
  };

  const fileList = (label: string, files: string[]) => files.length > 0 && (
    <div className="text-[11px]">
      <span className="text-[#929BA5]">{label} ({files.length})</span>
      <ul className="mt-1 list-inside list-disc break-all font-mono text-[#626D78]">
        {files.slice(0, 20).map((file) => <li key={`${label}:${file}`}>{file}</li>)}
      </ul>
      {files.length > 20 && <span className="text-[#626D78]">And {files.length - 20} more…</span>}
    </div>
  );

  return (
    <section className="mt-4 rounded border border-[#343B43] bg-[#14171B] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#C7A46A]" />
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[#F1F3F5]">
            Git repository{label ? ` · ${label}` : ''}
          </h3>
          {status?.isRepository && <span className="font-mono text-[10px] text-[#65B9A5]">{status.branch ?? 'detached HEAD'}</span>}
        </div>
        <button type="button" className={actionClass} onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-1 inline h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="mt-3 flex gap-2 rounded border border-[#DF7777]/50 bg-[#DF7777]/5 p-2.5 text-[11px] text-[#DF7777]"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {message && <div role="status" className="mt-3 rounded border border-[#65B9A5]/40 bg-[#65B9A5]/5 p-2.5 text-[11px] text-[#65B9A5]">{message}</div>}

      {!status && loading ? (
        <p className="mt-3 text-[11px] text-[#929BA5]">Checking repository status…</p>
      ) : !status?.isRepository ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-[11px] text-[#929BA5]">No repository initialized in this folder.</p>
          <button type="button" className={actionClass} disabled={loading} onClick={() => void perform(() => initializeGit(directory), 'Git repository initialized.')}>Initialize repository</button>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-[#2A3038] p-3">
              <div className="mb-2 text-[11px] text-[#929BA5]">Remotes</div>
              {status.remotes.length ? status.remotes.map((remote) => (
                <div key={remote.name} className="mb-2 break-all font-mono text-[10px] text-[#F1F3F5]">
                  {remote.name}: {remote.url}
                </div>
              )) : <p className="mb-2 text-[10px] text-[#626D78]">No remote configured.</p>}
              <label className="block text-[10px] text-[#929BA5]">
                HTTPS or SSH remote URL
                <input value={remoteUrl} onChange={(event) => setRemoteUrl(event.target.value)} className={`${fieldClass} mt-1`} placeholder="https://host/owner/repository.git" />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={actionClass}
                  disabled={loading || !remoteUrl.trim()}
                  onClick={() => status.remotes.some((item) => item.name === 'origin')
                    ? ask('Update origin remote?', 'This changes the remote URL used by Git push and pull. Authentication is handled by your system Git credential helper or SSH agent.', 'Update remote', () => connectGitRemote(directory, remoteUrl))
                    : void perform(() => connectGitRemote(directory, remoteUrl), 'Origin remote connected.')}
                >
                  {status.remotes.some((item) => item.name === 'origin') ? 'Update origin' : 'Connect origin'}
                </button>
                {status.remotes.some((item) => item.name === 'origin') && (
                  <button type="button" className={actionClass} disabled={loading} onClick={() => ask('Disconnect origin?', 'This removes the origin URL from this repository. Local commits and files remain unchanged, but push and pull will stop working until a remote is connected again.', 'Disconnect origin', () => disconnectGitRemote(directory))}>Disconnect</button>
                )}
              </div>
            </div>
            <div className="rounded border border-[#2A3038] p-3">
              <div className="mb-2 text-[11px] text-[#929BA5]">Working tree</div>
              {status.staged.length + status.modified.length + status.untracked.length === 0
                ? <p className="text-[11px] text-[#65B9A5]">Working tree clean.</p>
                : <div className="space-y-2">{fileList('Staged', status.staged)}{fileList('Modified', status.modified)}{fileList('Untracked', status.untracked)}</div>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={actionClass} disabled={loading || !status.modified.length && !status.untracked.length} onClick={() => void perform(() => stageGitChanges(directory), 'All changes staged.')}>Stage all changes</button>
                <button type="button" className={actionClass} disabled={loading || !status.remotes.some((item) => item.name === 'origin')} onClick={() => ask('Pull updates?', 'Git will fast-forward this branch only. If local changes or diverging history prevent a safe fast-forward, the operation will stop without creating a merge.', 'Pull updates', () => pullGitChanges(directory))}>Pull (fast-forward only)</button>
                <button type="button" className={actionClass} disabled={loading || !status.remotes.some((item) => item.name === 'origin')} onClick={() => ask('Push commits to origin?', 'This publishes local commits to the configured origin remote. Verify the repository and branch before continuing. Credentials are supplied by Git, not stored by VLI.', 'Push commits', () => pushGitChanges(directory))}>Push</button>
              </div>
              <form className="mt-3 flex gap-2" onSubmit={(event) => {
                event.preventDefault();
                void perform(() => commitGitChanges(directory, commitMessage), 'Commit created.');
              }}>
                <input value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} className={fieldClass} placeholder="Commit message" maxLength={2000} />
                <button type="submit" className={actionClass} disabled={loading || !commitMessage.trim() || !status.staged.length}>Commit</button>
              </form>
            </div>
          </div>

          <div className="mt-3 rounded border border-[#2A3038] p-3">
            <div className="mb-1 text-[11px] font-medium text-[#929BA5]">HTTPS authentication</div>
            <p className="mb-2 text-[10px] text-[#626D78]">Credentials are passed directly to the selected Git credential helper (OS-backed where available). VLI does not save or log them. SSH remotes should use your SSH agent.</p>
            <form className="grid gap-2 sm:grid-cols-[1fr_1fr_170px_auto]" onSubmit={(event) => {
              event.preventDefault();
              const saveCredential = async () => {
                const nextStatus = await saveGitAuthentication(directory, authUsername, authToken, credentialHelper);
                setAuthToken('');
                return nextStatus;
              };
              ask(
                'Save credentials to the Git helper?',
                'This stores the HTTPS token in the selected system Git credential helper, not in VLI. It also replaces this repository’s local credential-helper setting. Continue only if this is the intended helper.',
                'Save credentials',
                saveCredential
              );
            }}>
              <input aria-label="Git account name" value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} className={fieldClass} placeholder="Git account name" autoComplete="username" />
              <input aria-label="Git access token" type="password" value={authToken} onChange={(event) => setAuthToken(event.target.value)} className={fieldClass} placeholder="Access token (never stored by VLI)" autoComplete="new-password" />
              <select aria-label="Git credential helper" value={credentialHelper} onChange={(event) => setCredentialHelper(event.target.value as GitCredentialHelper)} className={fieldClass}>
                <option value="manager">Git Credential Manager</option>
                <option value="osxkeychain">macOS Keychain</option>
                <option value="libsecret">Linux libsecret</option>
                <option value="cache">Temporary Git cache</option>
              </select>
              <button type="submit" className={actionClass} disabled={loading || !authUsername.trim() || !authToken}>Save to helper</button>
            </form>
          </div>

          <div className="mt-3 rounded border border-[#2A3038] p-3">
            <div className="mb-2 text-[11px] font-medium text-[#929BA5]">Repository identity and signing</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input aria-label="Git author name" value={signing.name} onChange={(event) => setSigning({ ...signing, name: event.target.value })} className={fieldClass} placeholder="Author name" />
              <input aria-label="Git author email" value={signing.email} onChange={(event) => setSigning({ ...signing, email: event.target.value })} className={fieldClass} placeholder="author@example.com" />
              <select aria-label="Git signing format" value={signing.format} onChange={(event) => setSigning({ ...signing, format: event.target.value as GitSigningConfig['format'] })} className={fieldClass}>
                <option value="openpgp">OpenPGP / GPG</option><option value="ssh">SSH</option>
              </select>
              <input aria-label="Git signing key reference" value={signing.signingKey ?? ''} onChange={(event) => setSigning({ ...signing, signingKey: event.target.value })} className={fieldClass} placeholder={signing.format === 'ssh' ? 'Path to SSH public key' : 'GPG key ID'} />
            </div>
            <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-[#929BA5]">
              <input type="checkbox" checked={signing.enabled} onChange={(event) => setSigning({ ...signing, enabled: event.target.checked })} className="accent-[#C7A46A]" />
              Sign commits in this repository
            </label>
            <p className="mt-1 text-[10px] text-[#626D78]">Only the public key reference is configured here. Keep private keys in your OS key agent; VLI never reads or stores them.</p>
            <button type="button" className={`${actionClass} mt-2`} disabled={loading} onClick={() => void saveSigning()}>Save Git identity and signing</button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? ''}
        description={confirmation?.description ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Confirm'}
        destructive
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) void perform(confirmation.action, 'Git operation completed.');
        }}
      />
    </section>
  );
};
