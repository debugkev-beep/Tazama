import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const listings = [
  {
    id: 1,
    title: 'Red Soil Ridge',
    location: 'Rongai, Kajiado',
    price: 'KES 4.8M',
    size: '1/2 acre',
    accent: 'coral',
    note: 'Quiet ridge with a clear access road and long valley views.',
    docs: ['Title deed photo', 'Survey map', 'Seller declaration'],
    status: 'active',
    listingAge: '2 months',
    sellerResponseRate: '92%',
    coordinates: [-1.395, 36.75],
    boundary: [
      [-1.410, 36.744],
      [-1.387, 36.760],
      [-1.378, 36.772],
      [-1.405, 36.778],
      [-1.415, 36.750],
    ],
  },
  {
    id: 2,
    title: 'Acacia View',
    location: 'Tigoni, Kiambu',
    price: 'KES 12.5M',
    size: '1 acre',
    accent: 'ochre',
    note: 'Gentle slope, mature trees and a visible all-weather road.',
    docs: ['Title deed photo', 'Seller declaration'],
    status: 'pending',
    listingAge: '5 months',
    sellerResponseRate: '88%',
    coordinates: [-1.17, 36.72],
    boundary: [
      [-1.180, 36.710],
      [-1.165, 36.720],
      [-1.158, 36.734],
      [-1.170, 36.742],
      [-1.190, 36.728],
    ],
  },
  {
    id: 3,
    title: 'The Orchard Plot',
    location: 'Limuru, Kiambu',
    price: 'KES 7.2M',
    size: '3/4 acre',
    accent: 'sage',
    note: 'A tucked-away parcel beside established smallholdings.',
    docs: ['Survey map', 'Seller declaration'],
    status: 'active',
    listingAge: '1 month',
    sellerResponseRate: '80%',
    coordinates: [-1.1, 36.64],
    boundary: [
      [-1.112, 36.630],
      [-1.094, 36.646],
      [-1.100, 36.662],
      [-1.118, 36.650],
    ],
  },
  {
    id: 4,
    title: 'Riverbend Acre',
    location: 'Kiserian, Kajiado',
    price: 'KES 5.9M',
    size: '1 acre',
    accent: 'clay',
    note: 'Open land near the river line, with a broad rectangular boundary.',
    docs: ['Title deed photo', 'Survey map', 'Seller declaration'],
    status: 'sold',
    listingAge: '8 months',
    sellerResponseRate: '74%',
    coordinates: [-1.43, 36.69],
    boundary: [
      [-1.440, 36.682],
      [-1.425, 36.687],
      [-1.420, 36.706],
      [-1.442, 36.706],
      [-1.450, 36.690],
    ],
  },
]

const initialPolygon = [
  [20, 56],
  [36, 42],
  [54, 49],
  [47, 73],
  [28, 76],
]

function SatelliteMap({ listings, selectedId, onSelect }) {
  const mapElement = useRef(null)

  useEffect(() => {
    if (!mapElement.current) {
      return undefined
    }

    const map = L.map(mapElement.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([-1.28, 36.73], 10)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
    }).addTo(map)
    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tazama preview',
    }).addTo(map)

    const selectedListing = listings.find((listing) => listing.id === selectedId) ?? listings[0]
    if (selectedListing?.boundary) {
      const boundary = L.polygon(selectedListing.boundary, {
        color: '#f7e8c6',
        weight: 2,
        dashArray: '5 5',
        fillColor: '#e86f51',
        fillOpacity: 0.22,
      }).addTo(map)
      map.fitBounds(boundary.getBounds(), { padding: [50, 50] })
    }

    listings.forEach((listing) => {
      const marker = L.marker(listing.coordinates, {
        icon: L.divIcon({
          className: `tazama-marker ${selectedId === listing.id ? 'selected-marker' : ''}`,
          html: `<span>${listing.price}</span>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
      }).addTo(map)

      marker.on('click', () => onSelect(listing.id))
    })

    return () => map.remove()
  }, [listings, selectedId, onSelect])

  return <div className="satellite-map" ref={mapElement} />
}

function App() {
  const [view, setView] = useState('explore')
  const [selectedId, setSelectedId] = useState(1)
  const [savedIds, setSavedIds] = useState([1])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [polygon, setPolygon] = useState(initialPolygon)
  const [inquiryText, setInquiryText] = useState('I would like to arrange a physical visit to the plot and confirm access. Please share the best time to view it.')
  const [inquirySent, setInquirySent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('tazama-legal') !== 'accepted'
  })
  const [legalAccepted, setLegalAccepted] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('tazama-legal') === 'accepted'
  })
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('tazama-session') === 'active'
  })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedId) ?? listings[0],
    [selectedId],
  )

  const visibleListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesText = `${listing.title} ${listing.location}`
        .toLowerCase()
        .includes(query.toLowerCase())

      if (view === 'saved') {
        return savedIds.includes(listing.id) && matchesText
      }

      if (filter === 'under-10m') {
        const numericPrice = Number.parseFloat(listing.price.replace(/[^0-9.]/g, ''))
        return matchesText && numericPrice < 10
      }

      if (filter === 'one-acre') {
        const numericSize = Number.parseFloat(listing.size.replace(/[^0-9.]/g, ''))
        return matchesText && numericSize >= 1
      }

      return matchesText
    })
  }, [filter, query, savedIds, view])

  useEffect(() => {
    if (visibleListings.length > 0 && !visibleListings.some((listing) => listing.id === selectedId)) {
      setSelectedId(visibleListings[0].id)
    }
  }, [selectedId, visibleListings])

  const toggleSaved = (id) => {
    setSavedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  const addPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nextPoint = [
      Math.round(((event.clientX - rect.left) / rect.width) * 100),
      Math.round(((event.clientY - rect.top) / rect.height) * 100),
    ]

    setPolygon((current) => [...current, nextPoint])
  }

  const handleAcceptLegal = () => {
    setLegalAccepted(true)
    setShowLegalModal(false)
    window.localStorage.setItem('tazama-legal', 'accepted')
  }

  const handleLogin = (event) => {
    event.preventDefault()

    const emailIsValid = loginForm.email.includes('@') && loginForm.email.includes('.')
    const passwordIsValid = loginForm.password.trim().length >= 6

    if (!emailIsValid || !passwordIsValid) {
      setLoginError('Use a valid email and a password with at least 6 characters.')
      return
    }

    setLoginError('')
    setIsLoggedIn(true)
    window.localStorage.setItem('tazama-session', 'active')
  }

  const submitInquiry = async () => {
    if (!legalAccepted) {
      setShowLegalModal(true)
      return
    }

    setIsSending(true)

    try {
      await fetch('http://localhost:4000/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          buyerMessage: inquiryText,
          disclaimerAccepted: legalAccepted,
        }),
      })

      setInquirySent(true)
      setInquiryText('I would like to arrange a physical visit to the plot and confirm access. Please share the best time to view it.')
    } catch (error) {
      console.error('Inquiry send failed', error)
      setInquirySent(true)
    } finally {
      setIsSending(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <div className="login-shell">
          <div className="login-visual">
            <div className="login-badge">T</div>
            <p className="eyebrow">DISCOVER LAND WITH CONTEXT</p>
            <h1>Sell smarter. Buy with fewer surprises.</h1>
            <p>
              Tazama helps people find land, inspect it remotely, and reach out only when the opportunity is real.
            </p>
          </div>

          <form className="login-card" onSubmit={handleLogin}>
            <p className="eyebrow login-eyebrow">WELCOME BACK</p>
            <h2>Sign in to Tazama</h2>

            <label className="login-field">
              Email address
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </label>

            <label className="login-field">
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••••"
              />
            </label>

            {loginError && <div className="login-error">{loginError}</div>}

            <button type="submit" className="primary-button login-button">
              Sign in <span>→</span>
            </button>

            <div className="login-meta">
              <span>New to Tazama?</span>
              <button type="button" className="text-link">Create an account</button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setView('explore')} aria-label="Tazama home">
          <span className="brand-mark">T</span>
          <span>tazama</span>
        </button>

        <nav className="main-nav" aria-label="Primary navigation">
          <button type="button" className={view === 'explore' ? 'active' : ''} onClick={() => setView('explore')}>
            Explore land
          </button>
          <button type="button" className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}>
            Saved <span className="nav-count">{savedIds.length}</span>
          </button>
          <button type="button" className={view === 'sell' ? 'active' : ''} onClick={() => setView('sell')}>
            List a plot
          </button>
        </nav>

        <button className="profile-button" type="button">
          <span className="avatar">AN</span>
          <span className="profile-name">Amina N.</span>
          <span className="chevron">⌄</span>
        </button>
      </header>

      <section className="intro-row">
        <div>
          <p className="eyebrow">REMOTE PLOT INSPECTION / NAIROBI REGION</p>
          <h1>
            Find land with
            <br />
            <em>fewer surprises.</em>
          </h1>
        </div>

        <p className="intro-copy">
          Discover, inspect remotely, and reach out only when the plot matches the real-world decision you are ready to make.
        </p>
      </section>

      {view === 'sell' ? (
        <section className="sell-layout">
          <div className="sell-copy">
            <p className="eyebrow">SELLER WORKFLOW / STEP 01</p>
            <h2>
              Show your plot
              <br />
              <em>as it is.</em>
            </h2>
            <p>
              Add the basics, draw the boundary on satellite imagery, and be transparent about what is seller-provided and not independently verified.
            </p>

            <div className="step-list">
              <div className="step active-step">
                <b>01</b>
                <span>Account &amp; basic info</span>
              </div>
              <div className="step">
                <b>02</b>
                <span>Create listing</span>
              </div>
              <div className="step">
                <b>03</b>
                <span>Review &amp; publish</span>
              </div>
            </div>

            <div className="seller-form-grid">
              <label>
                Phone
                <input value="+254 712 345 678" readOnly />
              </label>
              <label>
                Email
                <input value="amina@tazama.example" readOnly />
              </label>
              <label className="full-width">
                Title
                <input placeholder="e.g. Prime plot near Rongai access road" />
              </label>
              <label>
                Price
                <input value="KES 4.8M" readOnly />
              </label>
              <label>
                Size
                <input value="1/2 acre" readOnly />
              </label>
              <label className="full-width">
                Location name
                <input value="Rongai, Kajiado" readOnly />
              </label>
              <label className="full-width">
                Description
                <textarea rows="4" value="Open plot with clear access road, gentle slope, and good visibility from the main track. Suitable for residential development or holding." readOnly />
              </label>
            </div>

            <div className="document-label-box">
              <span className="doc-mark">!</span>
              <div>
                <strong>Seller-provided, not verified by Tazama</strong>
                <p>Uploaded documents are tagged as self-declared only. They are never presented as authenticated records.</p>
              </div>
            </div>

            <button className="primary-button" type="button" onClick={() => setView('explore')}>
              Publish listing <span>→</span>
            </button>
          </div>

          <div className="draw-map" onClick={addPoint} role="application" aria-label="Click to draw a plot boundary">
            <div className="map-label">
              <span className="live-dot" />
              SATELLITE PREVIEW
              <small>Click the map to add boundary points</small>
            </div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="polygon-layer">
              <polygon points={polygon.map((point) => point.join(',')).join(' ')} />
              <polyline points={polygon.map((point) => point.join(',')).join(' ')} />
            </svg>

            {polygon.map((point, index) => (
              <i
                key={`${point[0]}-${point[1]}-${index}`}
                className="draw-point"
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              />
            ))}

            <div className="map-tools">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setPolygon((current) => current.slice(0, -1))
                }}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setPolygon(initialPolygon)
                }}
              >
                Clear
              </button>
            </div>

            <div className="map-scale">100 m</div>
          </div>
        </section>
      ) : (
        <section className="workspace">
          <aside className="listing-panel">
            <div className="search-wrap">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by place or feel" />
            </div>

            <div className="filter-row">
              <button type="button" className={filter === 'all' ? 'filter active-filter' : 'filter'} onClick={() => setFilter('all')}>
                All plots
              </button>
              <button type="button" className={filter === 'under-10m' ? 'filter active-filter' : 'filter'} onClick={() => setFilter('under-10m')}>
                Under KES 10M
              </button>
              <button type="button" className={filter === 'one-acre' ? 'filter active-filter' : 'filter'} onClick={() => setFilter('one-acre')}>
                1 acre +
              </button>
            </div>

            <div className="list-heading">
              <span>{view === 'saved' ? 'Your saved plots' : 'Plots near Nairobi'}</span>
              <span className="result-count">{visibleListings.length} found</span>
            </div>

            <div className="listing-list">
              {visibleListings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  className={`listing-card ${selectedListing.id === listing.id ? 'selected-card' : ''}`}
                  onClick={() => setSelectedId(listing.id)}
                >
                  <div className={`listing-thumb thumb-${listing.accent}`}>
                    <span className="mini-road" />
                  </div>

                  <div className="listing-info">
                    <div className="listing-top">
                      <h3>{listing.title}</h3>
                      <span
                        className="heart"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleSaved(listing.id)
                        }}
                      >
                        {savedIds.includes(listing.id) ? '♥' : '♡'}
                      </span>
                    </div>

                    <p>{listing.location}</p>
                    <div className="listing-meta">
                      <strong>{listing.price}</strong>
                      <span>{listing.size}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {view === 'saved' && savedIds.length === 0 && <p className="empty-state">Saved plots will appear here as you explore.</p>}
          </aside>

          <div className="map-panel">
            <div className="map-toolbar">
              <div className="map-mode">
                <button type="button" className="selected-mode">Satellite</button>
                <button type="button">Road map</button>
              </div>
              <button type="button" className="locate">◎ <span>Locate me</span></button>
            </div>

            <SatelliteMap listings={listings} selectedId={selectedListing.id} onSelect={setSelectedId} />

            <div className="detail-drawer">
              <div className={`detail-image image-${selectedListing.accent}`}>
                <span className="image-caption">AERIAL VIEW / {selectedListing.location.toUpperCase()}</span>
              </div>

              <div className="detail-content">
                <div className="detail-heading">
                  <div>
                    <p className="eyebrow">LISTING / {selectedListing.status.toUpperCase()}</p>
                    <h2>{selectedListing.title}</h2>
                  </div>
                </div>

                <p className="detail-note">{selectedListing.note}</p>

                <div className="detail-stats">
                  <div>
                    <span>PRICE</span>
                    <strong>{selectedListing.price}</strong>
                  </div>
                  <div>
                    <span>SIZE</span>
                    <strong>{selectedListing.size}</strong>
                  </div>
                  <div>
                    <span>AGE</span>
                    <strong>{selectedListing.listingAge}</strong>
                  </div>
                </div>

                <div className="trust-row">
                  <span>Documents: {selectedListing.docs.length}</span>
                  <span>Seller response: {selectedListing.sellerResponseRate}</span>
                  <span>Unverified listing</span>
                </div>

                <div className="disclosure">
                  <span className="disclosure-icon">!</span>
                  <p>
                    <strong>Verify ownership independently</strong> via the Ministry of Lands / Ardhisasa and a lawyer before proceeding.
                  </p>
                </div>

                <div className="doc-tags">
                  {selectedListing.docs.map((doc) => (
                    <span key={`${selectedListing.id}-${doc}`} className="doc-tag">
                      {doc}
                    </span>
                  ))}
                  <span className="doc-tag neutral">Seller-provided, not verified by Tazama</span>
                </div>

                <div className="cta-row">
                  <button type="button" className="primary-button" onClick={submitInquiry} disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send inquiry'} <span>→</span>
                  </button>
                  <button type="button" className="secondary-button" onClick={() => toggleSaved(selectedListing.id)}>
                    {savedIds.includes(selectedListing.id) ? 'Saved' : 'Save plot'}
                  </button>
                </div>

                {inquirySent && (
                  <div className="success-note">
                    Inquiry sent. Tazama only connects the buyer and seller; visits, legal checks, and negotiation happen outside the platform.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="legal-bar">
        <span className="legal-mark">!</span>
        <span>
          <strong>Always verify before you visit.</strong> Tazama does not verify ownership, documents, or transactions. Speak with the Ministry of Lands / Ardhisasa and an independent lawyer.
        </span>
        <a href="#legal">Read our boundaries →</a>
      </footer>

      {showLegalModal && (
        <div className="disclaimer-modal" aria-modal="true" role="dialog">
          <div className="modal-card">
            <p className="eyebrow">LEGAL REMINDER</p>
            <h3>Verify ownership independently before proceeding.</h3>
            <p>
              Tazama is a discovery and pre-screening layer. It does not verify ownership, title documents, or the final transaction. Buyers should confirm land records with the Ministry of Lands / Ardhisasa and an independent lawyer before visiting or negotiating.
            </p>
            <button type="button" className="primary-button" onClick={handleAcceptLegal}>
              I understand <span>→</span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
