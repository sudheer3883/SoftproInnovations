import { useState } from 'react'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AccountSidebar from '../../components/AccountSidebar'

const ChangePassword = () => {
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [message, setMessage] = useState({ type: '', text: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [visibleFields, setVisibleFields] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
    const passwordChecks = {
        length: formData.newPassword.length >= 6,
        number: /\d/.test(formData.newPassword),
        match: formData.newPassword.length > 0 && formData.newPassword === formData.confirmPassword,
    }
    const strength = Object.values(passwordChecks).filter(Boolean).length

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value })
        setMessage({ type: '', text: '' })
    }

    const toggleVisibility = (field) => {
        setVisibleFields({ ...visibleFields, [field]: !visibleFields[field] })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' })
            return
        }
        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters.' })
            return
        }

        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId')
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        setIsSubmitting(true)
        try {
            const response = await axios.patch(`http://localhost:5000/api/user/change-password/${userId}`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            }, { headers: { Authorization: `Bearer ${token}` } })
            setMessage({ type: 'success', text: response.data.msg || 'Password changed successfully.' })
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.msg || 'Unable to change password. Please try again.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Header />
            <main className="profile-page account-subpage">
                <AccountSidebar subtitle="Keep your account secure" />
                <section className="settings-main" aria-labelledby="password-title">
                    <header className="settings-heading">
                        <span className="review-eyebrow"><i className="bi bi-shield-lock" /> Account security</span>
                        <h1 id="password-title">Change Password</h1>
                        <p>Update your password regularly to keep your account secure.</p>
                    </header>
                    <form className="settings-card password-card" onSubmit={handleSubmit}>
                        <div className="settings-card-heading">
                            <h2>Create a new password</h2>
                            <span>Use a password you do not use on another website.</span>
                        </div>
                        <div className="settings-fields password-fields">
                            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => <label key={field} htmlFor={field}>{field === 'currentPassword' ? 'CURRENT PASSWORD' : field === 'newPassword' ? 'NEW PASSWORD' : 'CONFIRM NEW PASSWORD'} <b>*</b><span className="password-input-wrap"><input id={field} name={field} type={visibleFields[field] ? 'text' : 'password'} value={formData[field]} onChange={handleChange} required minLength={field === 'currentPassword' ? undefined : 6} autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'} placeholder={field === 'currentPassword' ? 'Enter your current password' : field === 'newPassword' ? 'At least 6 characters' : 'Re-enter your new password'} /><button type="button" onClick={() => toggleVisibility(field)} aria-label={visibleFields[field] ? 'Hide password' : 'Show password'}><i className={`bi ${visibleFields[field] ? 'bi-eye-slash' : 'bi-eye'}`} /></button></span></label>)}
                        </div>
                        <div className="password-guidance"><div className="password-strength"><span>Password strength</span><div>{[1, 2, 3].map((level) => <i className={strength >= level ? 'filled' : ''} key={level} />)}</div><strong>{strength < 2 ? 'Needs improvement' : strength === 2 ? 'Almost there' : 'Good to go'}</strong></div><p><i className={passwordChecks.length ? 'bi bi-check-circle-fill' : 'bi bi-circle'} /> At least 6 characters <i className={passwordChecks.number ? 'bi bi-check-circle-fill' : 'bi bi-circle'} /> Include one number <i className={passwordChecks.match ? 'bi bi-check-circle-fill' : 'bi bi-circle'} /> Passwords match</p></div>
                        {message.text && <div className={`password-message ${message.type}`} role="alert"><i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}`} /> {message.text}</div>}
                        <button className="settings-save" type="submit" disabled={isSubmitting}><i className="bi bi-lock" /> {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}</button>
                    </form>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default ChangePassword
