import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { backend_url } from '../App';
import { formatCurrency } from '../Utils/formatCurrency';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setIsLoading(true);
            const authToken = localStorage.getItem('auth-token');
            if (!authToken) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${backend_url}/order/${id}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'auth-token': authToken,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const data = await response.json();
            
            if (data.success) {
                setOrder(data.order);
            } else {
                setError(data.message || 'Đã có lỗi xảy ra khi tải chi tiết đơn hàng');
            }
        } catch (error) {
            setError('Đã có lỗi khi tải thông tin đơn hàng');
            console.error('Error fetching order details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            setCancelLoading(true);
            const authToken = localStorage.getItem('auth-token');
            const response = await fetch(`${backend_url}/order/cancel/${id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'auth-token': authToken,
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                fetchOrderDetails();  // Refresh order details
                alert('Đơn hàng đã được hủy thành công');
            } else {
                const data = await response.json();
                alert(data.message || 'Không thể hủy đơn hàng');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Đã xảy ra lỗi khi hủy đơn hàng');
        } finally {
            setCancelLoading(false);
        }
    };

    // Hiển thị trạng thái đơn hàng với màu sắc
    const getStatusClass = (status) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Text tiếng Việt cho trạng thái
    const getStatusText = (status) => {
        switch(status) {
            case 'pending': return 'Chờ xử lý';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đang vận chuyển';
            case 'delivered': return 'Đã giao hàng';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    // Format payment method
    const getPaymentMethodText = (method) => {
        switch(method) {
            case 'cod': return 'Thanh toán khi nhận hàng (COD)';
            case 'bank_transfer': return 'Chuyển khoản ngân hàng';
            case 'momo': return 'Ví MoMo';
            default: return method;
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="spinner mb-4"></div>
                        <p>Đang tải thông tin đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
                    {error}
                </div>
                <Link to="/orders" className="bg-black text-white px-4 py-2 rounded">
                    Quay lại danh sách đơn hàng
                </Link>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 text-yellow-700 p-4 mb-6 rounded">
                    Không tìm thấy thông tin đơn hàng
                </div>
                <Link to="/orders" className="bg-black text-white px-4 py-2 rounded">
                    Quay lại danh sách đơn hàng
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Chi tiết đơn hàng #{order.id}</h1>
                <Link to="/orders" className="text-blue-600 hover:underline">
                    &larr; Quay lại danh sách đơn hàng
                </Link>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                {/* Order info & shipping */}
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Thông tin đơn hàng</h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="text-gray-600">Tổng tiền:</span>
                                    <span className="ml-2 font-bold text-lg">
                                        {formatCurrency(order.total_amount)}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-gray-600">Phương thức thanh toán:</span>
                                    <span className="ml-2">
                                        {getPaymentMethodText(order.payment_method)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Trạng thái thanh toán:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Thông tin giao hàng</h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="text-gray-600">Địa chỉ:</span>
                                    <p className="mt-1">{order.shipping_address}</p>
                                </div>
                                <div className="mb-2">
                                    <span className="text-gray-600">Số điện thoại:</span>
                                    <span className="ml-2">{order.phone_number}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Email:</span>
                                    <span className="ml-2">{order.email}</span>
                                </div>
                                {order.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <span className="text-gray-600">Ghi chú:</span>
                                        <p className="mt-1 italic">{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Products */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Sản phẩm</h2>
                        <div className="border rounded-lg overflow-hidden">
                            {order.items && order.items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                                    Hình ảnh
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tên sản phẩm
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Đơn giá
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số lượng
                                                </th>
                                                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thành tiền
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {order.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <div className="w-16 h-16 rounded border overflow-hidden">
                                                            <img
                                                                src={item.image ? `${backend_url}${item.image}` : ''}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <div className="text-sm font-medium text-gray-900 mb-1">{item.name}</div>
                                                        {(item.color || item.size) && (
                                                            <div className="text-xs text-gray-500">
                                                                {item.color && <span className="mr-2">Màu: {item.color}</span>}
                                                                {item.size && <span>Size: {item.size}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="text-sm text-gray-900">{formatCurrency(item.price)}</div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="text-sm text-gray-900">
                                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="4" className="px-3 py-3 text-right text-sm font-medium text-gray-900">
                                                    Tổng tiền:
                                                </td>
                                                <td className="px-3 py-3 text-center text-sm font-bold text-gray-900">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    Không có thông tin chi tiết sản phẩm
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    {(order.status === 'pending' || order.status === 'processing') && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelLoading}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                {cancelLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail; 