import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

function Sales() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token] = useState(localStorage.getItem('token') || '');
  const [showModal, setShowModal] = useState(false);
  const [sellId, setSellId] = useState(null);
  const [sellPrice, setSellPrice] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:3000/parts`);
      const data = await res.json();
      const filtered = data.filter(
        part =>
          part.id.toString() === search.trim() ||
          part.name.toLowerCase().includes(search.trim().toLowerCase())
      );
      setResults(filtered);
      if (filtered.length === 0) setError('No matching parts found.');
    } catch (err) {
      setError('Failed to search parts.');
    }
    setLoading(false);
  };

  const handleSell = (id) => {
    setSellId(id);
    setSellPrice('');
    setShowModal(true);
  };

  const handleConfirmSell = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:3000/parts/${sellId}/sell`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ sold_price: sellPrice })
      });
      if (!res.ok) throw new Error('Failed to sell part');
      setSuccess('Part sold successfully!');
      setResults(results.map(part => part.id === sellId ? { ...part, stock_status: 'sold', sold_date: new Date().toISOString().split('T')[0], sold_price: sellPrice } : part));
      setShowModal(false);
    } catch (err) {
      setError('Failed to sell part.');
    }
  };

  return (
    <div className="container-fluid px-2 px-md-4">
      <div className="card p-2 p-md-4 mt-4 shadow-sm">
        <h2 className="mb-3 fs-4 fs-md-2">Sales</h2>
        <form className="row g-2 g-md-3 mb-3" onSubmit={handleSearch}>
          <div className="col-12 col-md-8 mb-2 mb-md-0">
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID or Name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-4 d-grid">
            <button type="submit" className="btn btn-primary w-100">Search</button>
          </div>
        </form>
        {loading && <div className="alert alert-info">Loading...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {results.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered table-striped mt-3 align-middle text-nowrap fs-6">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>Status</th>
                  <th>Available From</th>
                  <th>Sold Date</th>
                  <th>Recommended Price (₹)</th>
                  <th>Sold Price (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map(part => (
                  <tr key={part.id}>
                    <td>{part.id}</td>
                    <td>{part.name}</td>
                    <td>{part.manufacturer}</td>
                    <td>
                      <span className={
                        part.stock_status === 'available' ? 'badge bg-success' :
                        part.stock_status === 'sold' ? 'badge bg-danger' :
                        part.stock_status === 'reserved' ? 'badge bg-warning text-dark' :
                        'badge bg-secondary'
                      }>
                        {part.stock_status.charAt(0).toUpperCase() + part.stock_status.slice(1)}
                      </span>
                    </td>
                    <td>{part.available_from ? part.available_from.slice(0, 10) : ''}</td>
                    <td>{part.sold_date ? part.sold_date.slice(0, 10) : ''}</td>
                    <td>{
                      part.recommended_price !== null && part.recommended_price !== undefined
                        ? `₹${parseFloat(part.recommended_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}`
                        : ''
                    }</td>
                    <td>{
                      part.sold_price !== null && part.sold_price !== undefined
                        ? `₹${parseFloat(part.sold_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}`
                        : ''
                    }</td>
                    <td>
                      {part.stock_status !== 'sold' ? (
                        <button className="btn btn-success btn-sm w-100" onClick={() => handleSell(part.id)}>
                          Sell
                        </button>
                      ) : (
                        <span className="badge bg-secondary w-100">Sold</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for selling price */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Selling Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="number"
            className="form-control"
            placeholder="Enter selling price"
            value={sellPrice}
            onChange={e => setSellPrice(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmSell} disabled={!sellPrice}>
            Confirm Sell
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Sales;
