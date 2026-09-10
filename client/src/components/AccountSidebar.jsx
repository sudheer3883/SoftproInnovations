import { NavLink, Link, useNavigate } from 'react-router-dom'

const getProfile = () => {
    const storedProfile = localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile')

    if (storedProfile) {
        try { return JSON.parse(storedProfile) } catch { return null }
    }

    const name = localStorage.getItem('name') || sessionStorage.getItem('name')
    const email = localStorage.getItem('email') || sessionStorage.getItem('email')
    return name || email ? { name, email } : null
}

const AccountSidebar = ({ subtitle = 'Manage your account' }) => {
    const navigate = useNavigate()
    const profile = getProfile()
    const initials = (profile?.name || 'User')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const handleLogout = () => {
        localStorage.clear()
        sessionStorage.clear()
        navigate('/login')
    }

    return (
        <aside className="settings-sidebar">
            <div className="account-user">
                <div className="account-avatar">
                    {profile?.picture ? <img src={profile.picture} alt="" /> : initials}
                </div>
                <h2>{profile?.name || 'My Account'}</h2>
                <p>{profile?.email || subtitle}</p>
            </div>
            <nav className="settings-nav" aria-label="Account settings">
                <NavLink className="settings-nav-link" to="/profile" end><i className="bi bi-person-gear" /> My Profile</NavLink>
                <NavLink className="settings-nav-link" to="/profile/orders"><i className="bi bi-bag-check" /> My Orders</NavLink>
                <NavLink className="settings-nav-link" to="/profile/addresses"><i className="bi bi-geo-alt" /> Addresses</NavLink>
                <NavLink className="settings-nav-link" to="/profile/reviews"><i className="bi bi-star" /> Reviews</NavLink>
                <NavLink className="settings-nav-link" to="/profile/wishlist"><i className="bi bi-heart" /> My Wishlist</NavLink>
                <NavLink className="settings-nav-link" to="/profile/change-password"><i className="bi bi-shield-lock" /> Change Password</NavLink>
            </nav>
            <button type="button" className="settings-logout" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" /> Logout
            </button>
            <Link className="account-browse-link" to="/Product"><i className="bi bi-arrow-left" /> Browse Products</Link>
        </aside>
    )
}

export default AccountSidebar
