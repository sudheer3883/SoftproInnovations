import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AccountSidebar from '../../components/AccountSidebar'

const getReviews = () => {
    try { return JSON.parse(localStorage.getItem('productReviews') || '[]') } catch { return [] }
}

const Reviews = () => {
    const [reviews, setReviews] = useState(getReviews)
    const [formData, setFormData] = useState({ product: '', rating: '5', comment: '' })
    const [saved, setSaved] = useState(false)
    const profile = (() => {
        try {
            return JSON.parse(localStorage.getItem('userProfile') || sessionStorage.getItem('userProfile') || 'null')
        } catch { return null }
    })()
    const averageRating = reviews.length
        ? (reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0'
    const handleSubmit = (event) => {
        event.preventDefault()
        const nextReviews = [{ ...formData, id: Date.now(), date: new Date().toLocaleDateString(), author: profile?.name || 'You' }, ...reviews]
        setReviews(nextReviews)
        localStorage.setItem('productReviews', JSON.stringify(nextReviews))
        setFormData({ product: '', rating: '5', comment: '' })
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2200)
    }

    const handleDelete = (id) => {
        const nextReviews = reviews.filter((review) => review.id !== id)
        setReviews(nextReviews)
        localStorage.setItem('productReviews', JSON.stringify(nextReviews))
    }

    return (
        <>
            <Header />
            <main className="profile-page account-subpage">
                <AccountSidebar subtitle="Share your product experience" />
                <section className="settings-main" aria-labelledby="reviews-title">
                    <header className="settings-heading review-heading"><div><span className="review-eyebrow"><i className="bi bi-stars" /> Community feedback</span><h1 id="reviews-title">My Reviews</h1><p>Your honest words help other shoppers buy with confidence.</p></div><Link className="review-browse-link" to="/Product"><i className="bi bi-arrow-up-right" /> Browse products</Link></header>
                    <div className="review-summary" aria-label="Review summary"><div className="review-summary-score"><strong>{averageRating}</strong><span className="review-stars" aria-hidden="true">{'★'.repeat(Math.round(Number(averageRating)))}{'☆'.repeat(5 - Math.round(Number(averageRating)))}</span><small>Average rating</small></div><div className="review-stat"><i className="bi bi-chat-heart" /><strong>{reviews.length}</strong><span>Reviews shared</span></div><div className="review-stat review-stat-note"><i className="bi bi-shield-check" /><strong>Verified voice</strong><span>Your feedback matters</span></div></div>
                    <div className="review-layout">
                        <form className="settings-card review-form-card" onSubmit={handleSubmit}>
                            <div className="settings-card-heading"><div><span className="review-step">01 / WRITE</span><h2>Tell us what you think</h2><span>A thoughtful review takes less than a minute.</span></div><i className="bi bi-pencil-square review-heading-icon" /></div>
                            <div className="review-fields">
                                <label>PRODUCT NAME <b>*</b><div className="review-input-wrap"><i className="bi bi-box-seam" /><input value={formData.product} onChange={(event) => setFormData({ ...formData, product: event.target.value })} required placeholder="Which product are you reviewing?" /></div></label>
                                <fieldset className="review-rating-field"><legend>YOUR RATING <b>*</b></legend><div className="rating-picker">{[5, 4, 3, 2, 1].map((rating) => <label key={rating}><input type="radio" name="rating" value={rating} checked={formData.rating === String(rating)} onChange={(event) => setFormData({ ...formData, rating: event.target.value })} /><span>{rating} <i className="bi bi-star-fill" /></span></label>)}</div></fieldset>
                                <label>YOUR REVIEW <b>*</b><textarea maxLength="500" value={formData.comment} onChange={(event) => setFormData({ ...formData, comment: event.target.value })} required placeholder="What did you like? What could be better?" /><small className="review-helper">Be specific, helpful, and kind. {formData.comment.length}/500</small></label>
                            </div>
                            <button className="settings-save review-submit" type="submit"><i className={saved ? 'bi bi-check2' : 'bi bi-send'} /> {saved ? 'Review published' : 'Publish review'} <i className="bi bi-arrow-right" /></button>
                        </form>
                        <section className="review-list-card"><div className="review-list-heading"><div><span className="review-step">02 / YOUR VOICE</span><h2>Reviews you have shared</h2></div><span className="review-count">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div>{reviews.length === 0 ? <div className="review-empty"><div className="review-empty-icon"><i className="bi bi-chat-square-heart" /></div><h3>Your review shelf is empty</h3><p>Once you share your first experience, it will appear here.</p><Link to="/Product">Find a product <i className="bi bi-arrow-right" /></Link></div> : <div className="review-items">{reviews.map((review) => <article className="review-item" key={review.id}><div className="review-item-top"><div className="review-product-mark"><i className="bi bi-box" /></div><div className="review-item-title"><strong>{review.product}</strong><span>{review.author || 'You'} <i className="bi bi-patch-check-fill" /> · {review.date}</span></div><button type="button" className="review-delete" onClick={() => handleDelete(review.id)} aria-label={`Delete review for ${review.product}`} title="Delete review"><i className="bi bi-trash3" /></button></div><div className="review-item-rating"><span className="review-stars">{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</span><span>{Number(review.rating) === 5 ? 'Excellent' : Number(review.rating) >= 4 ? 'Very good' : 'Your rating'}</span></div><p>{review.comment}</p></article>)}</div>}</section>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default Reviews
