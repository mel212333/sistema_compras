import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = 'http://localhost:3001/api/inventory';
const AUTH_URL = 'http://localhost:3001/api/auth';
const emptyPrinter = { name: '', brand: '', model: '', location: '', serialNumber: '', status: 'Activa' };
const emptyToner = { code: '', color: 'Negro', brand: '', model: '', stock: 0, minStock: 1, compatiblePrinter: '', printerId: '' };
const emptyMovement = { tonerId: '', type: 'Ingreso', quantity: 1, reason: '', requestedBy: '', periodDate: new Date().toISOString().slice(0, 10) };

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('tonerSession');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [data, setData] = useState({ printers: [], toners: [], movements: [] });
  const [printerForm, setPrinterForm] = useState(emptyPrinter);
  const [tonerForm, setTonerForm] = useState(emptyToner);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [editingTonerId, setEditingTonerId] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  async function login(event) {
    event.preventDefault();
    setNotice('');
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.message || 'No se pudo iniciar sesion.');
      return;
    }
    localStorage.setItem('tonerSession', JSON.stringify(result.user));
    setSession(result.user);
    setNotice('');
  }

  function logout() {
    localStorage.removeItem('tonerSession');
    setSession(null);
    setLoginForm({ username: 'admin', password: '' });
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'No se pudo completar la accion.' }));
      throw new Error(error.message);
    }
    return response.status === 204 ? null : response.json();
  }

  async function loadDashboard() {
    const dashboard = await request('/dashboard');
    setData(dashboard);
    setLoading(false);
  }

  async function savePrinter(event) {
    event.preventDefault();
    const method = editingPrinterId ? 'PUT' : 'POST';
    const path = editingPrinterId ? `/printers/${editingPrinterId}` : '/printers';
    await request(path, { method, body: JSON.stringify(printerForm) });
    setPrinterForm(emptyPrinter);
    setEditingPrinterId(null);
    setNotice('Impresora guardada correctamente.');
    await loadDashboard();
  }

  async function saveToner(event) {
    event.preventDefault();
    const method = editingTonerId ? 'PUT' : 'POST';
    const path = editingTonerId ? `/toners/${editingTonerId}` : '/toners';
    await request(path, { method, body: JSON.stringify(tonerForm) });
    setTonerForm(emptyToner);
    setEditingTonerId(null);
    setNotice('Toner guardado correctamente.');
    await loadDashboard();
  }

  async function saveMovement(event) {
    event.preventDefault();
    await request('/movements', { method: 'POST', body: JSON.stringify(movementForm) });
    setMovementForm(emptyMovement);
    setNotice('Movimiento registrado y stock actualizado.');
    await loadDashboard();
    await generateReport(reportPeriod);
  }

  async function removeEntity(type, id) {
    await request(`/${type}/${id}`, { method: 'DELETE' });
    setNotice('Registro eliminado.');
    await loadDashboard();
  }

  async function generateReport(period = reportPeriod) {
    const result = await request(`/reports?period=${period}`);
    setReport(result);
    setReportPeriod(period);
  }

  useEffect(() => {
    if (!session) return;
    loadDashboard().then(() => generateReport('weekly')).catch((error) => {
      setNotice(error.message);
      setLoading(false);
    });
  }, [session]);

  const stats = useMemo(() => {
    const lowStock = data.toners.filter((toner) => toner.stock <= toner.minStock).length;
    const totalStock = data.toners.reduce((sum, toner) => sum + Number(toner.stock), 0);
    const recentOut = data.movements
      .filter((movement) => movement.type === 'Egreso')
      .reduce((sum, movement) => sum + Number(movement.quantity), 0);
    return { lowStock, totalStock, recentOut };
  }, [data]);

  const editPrinter = (printer) => {
    setEditingPrinterId(printer.id);
    setPrinterForm({
      name: printer.name,
      brand: printer.brand,
      model: printer.model,
      location: printer.location,
      serialNumber: printer.serialNumber || '',
      status: printer.status
    });
  };

  const editToner = (toner) => {
    setEditingTonerId(toner.id);
    setTonerForm({
      code: toner.code,
      color: toner.color,
      brand: toner.brand,
      model: toner.model,
      stock: toner.stock,
      minStock: toner.minStock,
      compatiblePrinter: toner.compatiblePrinter || '',
      printerId: toner.printerId || ''
    });
  };

  if (!session) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div>
            <span className="eyebrow">Acceso seguro</span>
            <h1>Stock de Toner</h1>
            <p>Ingresá con tu usuario administrador para gestionar impresoras, tintas y movimientos.</p>
          </div>
          {notice && <p className="notice">{notice}</p>}
          <form onSubmit={login} className="login-form">
            <label>
              <span>Usuario</span>
              <input value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} autoComplete="username" />
            </label>
            <label>
              <span>Contrasena</span>
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} autoComplete="current-password" />
            </label>
            <button type="submit">Iniciar sesion</button>
          </form>
          <p className="login-hint">Usuario inicial: admin / sistemas</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <span className="eyebrow">Panel Admin</span>
          <h1>Stock de Toner</h1>
        </div>
        <nav>
          <a href="#toners">Toners</a>
          <a href="#printers">Impresoras</a>
          <a href="#movements">Movimientos</a>
          <a href="#reports">Reportes</a>
        </nav>
        <div className="admin-badge">
          <strong>{session.fullName}</strong>
          <span>{session.role} - Alta, modificacion y eliminacion habilitadas</span>
          <button className="logout-button" onClick={logout} type="button">Cerrar sesion</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Control operativo</span>
            <h2>Inventario de tintas e impresoras</h2>
          </div>
          <div className="topbar-actions">
            <button onClick={() => generateReport(reportPeriod)} type="button">Actualizar reporte</button>
          </div>
        </header>

        {notice && <p className="notice">{notice}</p>}

        <section className="metrics">
          <Metric label="Toners cargados" value={data.toners.length} />
          <Metric label="Unidades disponibles" value={stats.totalStock} />
          <Metric label="Alertas de stock" value={stats.lowStock} danger={stats.lowStock > 0} />
          <Metric label="Egresos recientes" value={stats.recentOut} />
        </section>

        {loading ? <p className="loading">Cargando inventario...</p> : (
          <>
            <section id="toners" className="grid two-columns">
              <FormPanel title={editingTonerId ? 'Modificar toner' : 'Alta de toner'}>
                <form onSubmit={saveToner} className="form-grid">
                  <Input label="Codigo" value={tonerForm.code} onChange={(value) => setTonerForm({ ...tonerForm, code: value })} />
                  <Select label="Color" value={tonerForm.color} onChange={(value) => setTonerForm({ ...tonerForm, color: value })} options={['Negro', 'Cian', 'Magenta', 'Amarillo', 'Multicolor']} />
                  <Input label="Marca" value={tonerForm.brand} onChange={(value) => setTonerForm({ ...tonerForm, brand: value })} />
                  <Input label="Modelo" value={tonerForm.model} onChange={(value) => setTonerForm({ ...tonerForm, model: value })} />
                  <Input label="Stock" type="number" value={tonerForm.stock} onChange={(value) => setTonerForm({ ...tonerForm, stock: Number(value) })} />
                  <Input label="Stock minimo" type="number" value={tonerForm.minStock} onChange={(value) => setTonerForm({ ...tonerForm, minStock: Number(value) })} />
                  <Select label="Impresora asignada" value={tonerForm.printerId} onChange={(value) => setTonerForm({ ...tonerForm, printerId: value })} options={['', ...data.printers.map((printer) => String(printer.id))]} labels={{ '': 'Sin asignar', ...Object.fromEntries(data.printers.map((printer) => [printer.id, `${printer.name} - ${printer.model}`])) }} />
                  <Input label="Compatibilidad" value={tonerForm.compatiblePrinter} onChange={(value) => setTonerForm({ ...tonerForm, compatiblePrinter: value })} />
                  <div className="actions">
                    <button type="submit">{editingTonerId ? 'Guardar cambios' : 'Crear toner'}</button>
                    {editingTonerId && <button className="ghost" type="button" onClick={() => { setEditingTonerId(null); setTonerForm(emptyToner); }}>Cancelar</button>}
                  </div>
                </form>
              </FormPanel>

              <DataPanel title="Inventario">
                <div className="table">
                  {data.toners.map((toner) => (
                    <div className="table-row" key={toner.id}>
                      <div><strong>{toner.code}</strong><span>{toner.brand} {toner.model} - {toner.color}</span></div>
                      <StatusPill toner={toner} />
                      <div className="row-actions">
                        <button className="ghost" onClick={() => editToner(toner)} type="button">Editar</button>
                        <button className="danger" onClick={() => removeEntity('toners', toner.id)} type="button">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </DataPanel>
            </section>

            <section id="printers" className="grid two-columns">
              <FormPanel title={editingPrinterId ? 'Modificar impresora' : 'Alta de impresora'}>
                <form onSubmit={savePrinter} className="form-grid">
                  <Input label="Nombre" value={printerForm.name} onChange={(value) => setPrinterForm({ ...printerForm, name: value })} />
                  <Input label="Marca" value={printerForm.brand} onChange={(value) => setPrinterForm({ ...printerForm, brand: value })} />
                  <Input label="Modelo" value={printerForm.model} onChange={(value) => setPrinterForm({ ...printerForm, model: value })} />
                  <Input label="Ubicacion" value={printerForm.location} onChange={(value) => setPrinterForm({ ...printerForm, location: value })} />
                  <Input label="Serie" value={printerForm.serialNumber} onChange={(value) => setPrinterForm({ ...printerForm, serialNumber: value })} />
                  <Select label="Estado" value={printerForm.status} onChange={(value) => setPrinterForm({ ...printerForm, status: value })} options={['Activa', 'Mantenimiento', 'Baja']} />
                  <div className="actions"><button type="submit">{editingPrinterId ? 'Guardar cambios' : 'Crear impresora'}</button></div>
                </form>
              </FormPanel>

              <DataPanel title="Impresoras">
                <div className="table">
                  {data.printers.map((printer) => (
                    <div className="table-row" key={printer.id}>
                      <div><strong>{printer.name}</strong><span>{printer.brand} {printer.model} - {printer.location}</span></div>
                      <span className="pill neutral">{printer.status}</span>
                      <div className="row-actions">
                        <button className="ghost" onClick={() => editPrinter(printer)} type="button">Editar</button>
                        <button className="danger" onClick={() => removeEntity('printers', printer.id)} type="button">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </DataPanel>
            </section>

            <section id="movements" className="grid two-columns">
              <FormPanel title="Movimiento de tinta">
                <form onSubmit={saveMovement} className="form-grid">
                  <Select label="Toner" value={movementForm.tonerId} onChange={(value) => setMovementForm({ ...movementForm, tonerId: value })} options={['', ...data.toners.map((toner) => String(toner.id))]} labels={{ '': 'Seleccionar', ...Object.fromEntries(data.toners.map((toner) => [toner.id, `${toner.code} - stock ${toner.stock}`])) }} />
                  <Select label="Tipo" value={movementForm.type} onChange={(value) => setMovementForm({ ...movementForm, type: value })} options={['Ingreso', 'Egreso', 'Ajuste']} />
                  <Input label="Cantidad" type="number" value={movementForm.quantity} onChange={(value) => setMovementForm({ ...movementForm, quantity: Number(value) })} />
                  <Input label="Fecha" type="date" value={movementForm.periodDate} onChange={(value) => setMovementForm({ ...movementForm, periodDate: value })} />
                  <Input label="Solicitante" value={movementForm.requestedBy} onChange={(value) => setMovementForm({ ...movementForm, requestedBy: value })} />
                  <Input label="Motivo" value={movementForm.reason} onChange={(value) => setMovementForm({ ...movementForm, reason: value })} />
                  <div className="actions"><button type="submit">Registrar movimiento</button></div>
                </form>
              </FormPanel>

              <DataPanel title="Ultimos movimientos">
                <div className="activity-list">
                  {data.movements.slice(0, 10).map((movement) => (
                    <article key={movement.id}>
                      <strong>{movement.type} - {movement.quantity} unidad/es</strong>
                      <span>{movement.toner?.code || 'Toner'} - {movement.reason} - {movement.periodDate}</span>
                    </article>
                  ))}
                </div>
              </DataPanel>
            </section>

            <section id="reports" className="report-panel">
              <div className="report-header">
                <div>
                  <span className="eyebrow">Reportes</span>
                  <h3>Movimiento semanal o mensual</h3>
                </div>
                <div className="segmented">
                  <button className={reportPeriod === 'weekly' ? 'active' : ''} onClick={() => generateReport('weekly')} type="button">Semanal</button>
                  <button className={reportPeriod === 'monthly' ? 'active' : ''} onClick={() => generateReport('monthly')} type="button">Mensual</button>
                </div>
              </div>
              {report && (
                <div className="report-grid">
                  <Metric label="Ingresos" value={report.summary.Ingreso} />
                  <Metric label="Egresos" value={report.summary.Egreso} />
                  <Metric label="Ajustes" value={report.summary.Ajuste} />
                  <Metric label="Movimientos" value={report.summary.totalMovements} />
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, danger }) {
  return <article className={`metric ${danger ? 'danger-metric' : ''}`}><span>{label}</span><strong>{value}</strong></article>;
}

function FormPanel({ title, children }) {
  return <section className="panel"><h3>{title}</h3>{children}</section>;
}

function DataPanel({ title, children }) {
  return <section className="panel data-panel"><h3>{title}</h3>{children}</section>;
}

function Input({ label, value, onChange, type = 'text' }) {
  const optional = ['Serie', 'Solicitante', 'Compatibilidad'].includes(label);
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={!optional} /></label>;
}

function Select({ label, value, onChange, options, labels = {} }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select></label>;
}

function StatusPill({ toner }) {
  const low = toner.stock <= toner.minStock;
  return <span className={`pill ${low ? 'low' : 'ok'}`}>Stock {toner.stock}</span>;
}

createRoot(document.getElementById('root')).render(<App />);
