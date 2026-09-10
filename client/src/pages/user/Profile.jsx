import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AccountSidebar from '../../components/AccountSidebar'

const getStoredProfile = () => {
    const storedProfile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile')

    if (storedProfile) {
        try {
            return JSON.parse(storedProfile)
        } catch {
            return null
        }
    }

    const name = localStorage.getItem('name') || sessionStorage.getItem('name')
    const email = localStorage.getItem('email') || sessionStorage.getItem('email')
    return name || email ? { name, email } : null
}

const Profile = () => {
    const profile = getStoredProfile()
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: profile?.email || '',
        mobile: profile?.mobile || '',
    })
    const [saved, setSaved] = useState(false)
    const handleSaveProfile = (event) => {
        event.preventDefault()
        const updatedProfile = { ...profile, ...formData }
        const storage = localStorage.getItem('userProfile') ? localStorage : sessionStorage
        storage.setItem('userProfile', JSON.stringify(updatedProfile))
        storage.setItem('name', formData.name)
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2500)
    }

    if (!profile) {
        return (
            <>
                <main className="profile-page profile-empty">
                    <div className="profile-card text-center">
                        <h1>Sign in to view your profile</h1>
                        <Link to="/login" className="btn btn-orangered mt-3">Go to login</Link>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Header />
            <main className="profile-page">
                <AccountSidebar />

                <section className="settings-main" aria-labelledby="profile-title">
                    <header className="settings-heading">
                        <h1 id="profile-title">Account Settings</h1>
                        <p>Manage your personal profile and security preferences.</p>
                    </header>
                    <form className="settings-card" onSubmit={handleSaveProfile}>
                        <div className="settings-card-heading"><h2>Personal Details</h2><span>Keep your account information up to date.</span></div>
                        <div className="settings-fields">
                            <label>FULL NAME <b>*</b><input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required /></label>
                            <div className="settings-field-row">
                                <label>EMAIL ADDRESS <b>*</b><input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required /></label>
                                <label>MOBILE NUMBER<input value={formData.mobile} onChange={(event) => setFormData({ ...formData, mobile: event.target.value })} /></label>
                            </div>
                        </div>
                        <button className="settings-save" type="submit"><i className="bi bi-check2-square" /> {saved ? 'PROFILE SAVED' : 'SAVE PROFILE'}</button>
                    </form>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default Profile