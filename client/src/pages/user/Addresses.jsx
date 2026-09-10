import { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AccountSidebar from '../../components/AccountSidebar'

const getAddresses = () => {
    try {
        return JSON.parse(localStorage.getItem('savedAddresses') || '[]')
    } catch {
        return []
    }
}

const emptyAddress = {
    fullName: '',
    mobile: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Home',
}

const Addresses = () => {
    const [addresses, setAddresses] = useState(getAddresses)
    const [formData, setFormData] = useState(emptyAddress)
    const [editingId, setEditingId] = useState(null)
    const [saved, setSaved] = useState(false)

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value })
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        const nextAddress = { ...formData, id: editingId || Date.now() }
        const nextAddresses = editingId
            ? addresses.map((address) => address.id === editingId ? nextAddress : address)
            : [...addresses, nextAddress]
        setAddresses(nextAddresses)
        localStorage.setItem('savedAddresses', JSON.stringify(nextAddresses))
        setFormData(emptyAddress)
        setEditingId(null)
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2200)
    }

    const handleEdit = (address) => {
        setFormData(address)
        setEditingId(address.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = (id) => {
        const nextAddresses = addresses.filter((address) => address.id !== id)
        setAddresses(nextAddresses)
        localStorage.setItem('savedAddresses', JSON.stringify(nextAddresses))
    }

    return (
        <>
            <Header />
            <main className="profile-page address-page">
                <AccountSidebar subtitle="Manage your saved details" />

                <section className="settings-main" aria-labelledby="address-title">
                    <header className="settings-heading">
                        <h1 id="address-title">Saved Addresses</h1>
                        <p>Add and manage delivery addresses for faster checkout.</p>
                    </header>
                    <div className="address-layout">
                        <form className="settings-card address-form-card" onSubmit={handleSubmit}>
                            <div className="settings-card-heading"><h2>{editingId ? 'Edit Address' : 'Add New Address'}</h2><span>Enter your complete delivery details.</span></div>
                            <div className="address-fields">
                                <label><span>FULL NAME <b>*</b></span><input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" /></label>
                                <div className="settings-field-row">
                                    <label><span>MOBILE NUMBER <b>*</b></span><input name="mobile" value={formData.mobile} onChange={handleChange} required pattern="[0-9]{10}" placeholder="10 digit mobile number" /></label>
                                    <label><span>PINCODE <b>*</b></span><input name="pincode" value={formData.pincode} onChange={handleChange} required pattern="[0-9]{6}" placeholder="6 digit pincode" /></label>
                                </div>
                                <label><span>ADDRESS <b>*</b></span><textarea name="address" value={formData.address} onChange={handleChange} required placeholder="House no., building, street, area" /></label>
                                <label><span>LANDMARK</span><input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Nearby landmark (optional)" /></label>
                                <div className="settings-field-row">
                                    <label><span>CITY <b>*</b></span><input name="city" value={formData.city} onChange={handleChange} required placeholder="City" /></label>
                                    <label><span>STATE <b>*</b></span><input name="state" value={formData.state} onChange={handleChange} required placeholder="State" /></label>
                                </div>
                                <div className="address-type-row"><span>ADDRESS TYPE</span>{['Home', 'Work', 'Other'].map((type) => <label key={type}><input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleChange} /> <span>{type}</span></label>)}</div>
                            </div>
                            <div className="address-form-actions"><button className="settings-save" type="submit"><i className="bi bi-check2-square" /> {saved ? 'ADDRESS SAVED' : editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}</button>{editingId && <button type="button" className="address-cancel" onClick={() => { setFormData(emptyAddress); setEditingId(null) }}>Cancel</button>}</div>
                        </form>
                        <section className="saved-addresses-list"><div className="saved-addresses-heading"><h2>Your Addresses</h2><span>{addresses.length} saved</span></div>{addresses.length === 0 ? <div className="address-empty"><i className="bi bi-geo-alt" /><p>No saved addresses yet.</p><small>Add an address to make checkout faster.</small></div> : addresses.map((address) => <article className="saved-address-card" key={address.id}><div className="saved-address-card-top"><span><i className="bi bi-house-door" /> {address.type}</span><div><button type="button" onClick={() => handleEdit(address)} aria-label="Edit address"><i className="bi bi-pencil" /></button><button type="button" onClick={() => handleDelete(address.id)} aria-label="Delete address"><i className="bi bi-trash" /></button></div></div><strong>{address.fullName}</strong><p>{address.address}{address.landmark ? `, ${address.landmark}` : ''}<br />{address.city}, {address.state} - {address.pincode}<br />Mobile: {address.mobile}</p></article>)}</section>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default Addresses
