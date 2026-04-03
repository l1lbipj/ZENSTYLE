function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BookingWidget() {
  return (
    <div className="zs-booking" id="booking">
      <div className="zs-booking__fields">
        <label className="zs-booking__field">
          <span className="zs-booking__label">SELECT SERVICE</span>
          <select className="zs-booking__control" defaultValue="">
            <option value="" disabled>
              Choose a service
            </option>
            <option>Hair styling</option>
            <option>Skincare</option>
            <option>Spa &amp; ritual</option>
          </select>
        </label>
        <label className="zs-booking__field">
          <span className="zs-booking__label">SELECT SPECIALIST</span>
          <select className="zs-booking__control" defaultValue="">
            <option value="" disabled>
              Any specialist
            </option>
            <option>Available stylist</option>
          </select>
        </label>
        <label className="zs-booking__field">
          <span className="zs-booking__label">PREFERRED DATE</span>
          <input className="zs-booking__control" type="date" />
        </label>
      </div>
      <button type="button" className="zs-btn zs-btn--primary zs-booking__cta">
        <IconCheck />
        Check Availability
      </button>
    </div>
  )
}
