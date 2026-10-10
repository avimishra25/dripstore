import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import './DemoContext.css';

const DemoContext = createContext({ enabled: false });
export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }) {
  const { user, saveAuth } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const resolver = useRef(null);
  const dialog = useRef(null);
  useEffect(() => {
    let active = true;
    api.get('/demo/status').then(({ data }) => { if (active) setEnabled(data.enabled); }).catch(() => {});
    return () => { active = false; resolver.current?.('cancel'); };
  }, []);
  useEffect(() => {
    if (choosing) dialog.current.showModal();
  }, [choosing]);
  const chooseDemoOutcome = () => new Promise(resolve => {
    resolver.current = resolve;
    setChoosing(true);
  });
  const finish = outcome => {
    resolver.current?.(outcome);
    resolver.current = null;
    setChoosing(false);
  };
  const enter = async (role, reset = false) => {
    if (reset && !window.confirm('Reset this shared demo? Sample products and orders will be restored, and other demo sessions will expire.')) return;
    setBusy(true);
    try {
      const { data } = await api.post(reset ? '/demo/reset' : '/demo/session', { role });
      localStorage.removeItem('dripstore_cart');
      localStorage.removeItem('dripstore_guest_merge_id');
      saveAuth(data.token, data.user);
      // Refresh sample data views after reset.
      navigate(data.user.isAdmin ? '/admin' : '/products');
      if (reset) setEpoch(value => value + 1);
      toast.success(reset ? 'Sample data restored' : 'Demo ' + role + ' ready');
    } catch (error) { toast.error(error.response?.data?.message || 'Demo could not start. Please retry.'); }
    finally { setBusy(false); }
  };
  return <DemoContext.Provider value={{ enabled, chooseDemoOutcome }}>
    {enabled && <aside className="demo-bar" aria-label="Demo controls">
      <div><strong>DEMO PLAYGROUND</strong><span>Sample data · No real payments or deliveries</span></div>
      <div className="demo-actions">
        <span>{user ? (user.isAdmin ? 'Admin' : 'Customer') : 'Guest'}</span>
        <button disabled={busy || choosing} onClick={() => enter('customer')}>Try customer</button>
        <button disabled={busy || choosing} onClick={() => enter('admin')}>Try admin</button>
        {user && <button disabled={busy || choosing} onClick={() => enter(null, true)}>Reset demo</button>}
      </div>
    </aside>}
    <React.Fragment key={epoch}>{children}</React.Fragment>
    {choosing && <dialog ref={dialog} className="demo-dialog" aria-labelledby="demo-payment-title" onCancel={event => { event.preventDefault(); finish('cancel'); }}>
      <span className="demo-eyebrow">PAYMENT SIMULATOR</span>
      <h2 id="demo-payment-title">Choose what happens</h2>
      <p>No card details. No money charged. Try an outcome and see how the store responds.</p>
      <button autoFocus onClick={() => finish('success')}>Successful payment <small>Confirm order and update inventory</small></button>
      <button onClick={() => finish('failure')}>Failed payment <small>Keep the order available for retry</small></button>
      <button onClick={() => finish('cancel')}>Cancel checkout <small>Return without paying</small></button>
    </dialog>}
  </DemoContext.Provider>;
}
