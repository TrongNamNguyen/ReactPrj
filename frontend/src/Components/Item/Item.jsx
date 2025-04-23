import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'
import { backend_url, currency } from '../../App'
import { formatCurrency } from '../../Utils/formatCurrency'

const Item = (props) => {
    const handleDetailClick = () => {
        window.scrollTo(0, 0); // Scroll lên đầu trang
    };

    return (
        <div className='item group relative'>
            <div className="item-image-container">
                <Link to={`/product/${props.id}`} onClick={handleDetailClick}>
                    <img src={props.image} alt="products" />
                </Link>
                
                {/* Overlay với 2 nút sẽ hiển thị khi hover */}
                <div className="item-overlay">
                    <div className="item-buttons">
                        <Link to={`/product/${props.id}`} className="item-button view-detail" onClick={handleDetailClick}>
                            Xem chi tiết
                        </Link>
                        <Link to="/cart" className="item-button add-to-cart">
                            Giỏ hàng
                        </Link>
                    </div>
                </div>
            </div>
            
            <div className="item-colors">
                {props.colors && props.colors.map((color, index) => {
                    return <div key={index} className="item-color">
                        <img src={color.image} alt="color" />
                    </div>
                })}
            </div>

            <p className="item-name">{props.name}</p>
            <div className="item-prices">
                <div className="item-price-new">{formatCurrency(props.new_price)}</div>
                <div className="item-price-old">{formatCurrency(props.old_price)}</div>
            </div>
        </div>
    )
}

export default Item
