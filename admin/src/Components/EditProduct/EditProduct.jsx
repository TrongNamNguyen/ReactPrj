import React, { useState, useEffect } from "react";
import "./EditProduct.css";
import upload_area from "../Assets/upload_area.svg";
import { backend_url } from "../../App";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Lưu trữ tất cả các đối tượng file cho hình ảnh
  const [images, setImages] = useState({
    main: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
  });

  // Đường dẫn xem trước cho hình ảnh
  const [imagePreviews, setImagePreviews] = useState({
    main: '',
    image2: '',
    image3: '',
    image4: '',
    image5: '',
    image6: '',
  });

  const [categories, setCategories] = useState([]);
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    image: "",
    image2: "",
    image3: "",
    image4: "",
    image5: "",
    image6: "",
    category_id: "",
    new_price: "",
    old_price: "",
    available: true
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tải danh sách danh mục
        const categoriesResponse = await fetch(`${backend_url}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Không thể tải danh sách danh mục');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
        
        // Tải thông tin sản phẩm
        const productResponse = await fetch(`${backend_url}/product/${id}`);
        if (!productResponse.ok) {
          throw new Error('Sản phẩm không tồn tại');
        }
        const productData = await productResponse.json();
        
        // Cập nhật chi tiết sản phẩm
        setProductDetails({
          name: productData.name,
          description: productData.description,
          image: productData.image,
          image2: productData.image2 || "",
          image3: productData.image3 || "",
          image4: productData.image4 || "",
          image5: productData.image5 || "",
          image6: productData.image6 || "",
          category_id: productData.category_id.toString(),
          new_price: productData.new_price,
          old_price: productData.old_price,
          available: productData.available === 1 || productData.available === true
        });
        
        // Cập nhật xem trước hình ảnh
        const previews = {
          main: productData.image ? backend_url + productData.image : '',
          image2: productData.image2 ? backend_url + productData.image2 : '',
          image3: productData.image3 ? backend_url + productData.image3 : '',
          image4: productData.image4 ? backend_url + productData.image4 : '',
          image5: productData.image5 ? backend_url + productData.image5 : '',
          image6: productData.image6 ? backend_url + productData.image6 : '',
        };
        setImagePreviews(previews);
        
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setError("Không thể tải thông tin. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      // Cập nhật state cho file ảnh
      setImages(prev => ({
        ...prev,
        [imageKey]: file
      }));
      
      // Tạo preview cho ảnh
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => ({
          ...prev,
          [imageKey]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (imageKey) => {
    // Không cho phép xóa ảnh chính nếu là ảnh main
    if (imageKey === 'main') {
      toast.warning("Ảnh chính là bắt buộc");
      return;
    }
    
    setImages(prev => ({
      ...prev,
      [imageKey]: null
    }));
    
    setImagePreviews(prev => ({
      ...prev,
      [imageKey]: ''
    }));
    
    // Cũng xóa giá trị trong productDetails
    setProductDetails(prev => ({
      ...prev,
      [imageKey]: ''
    }));
  };

  const uploadSingleImage = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${backend_url}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Tải ảnh lên thất bại (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Tải ảnh lên thất bại");
      }

      return data.image_url;
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      throw error;
    }
  };

  const handleUpdateProduct = async () => {
    if (!productDetails.name || !productDetails.description || !productDetails.category_id || !productDetails.new_price) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm");
      return;
    }
    
    if (!imagePreviews.main) {
      toast.error("Ảnh chính là bắt buộc");
      return;
    }
    
    try {
      setSubmitting(true);
      
      let updatedProduct = {...productDetails};
      updatedProduct.category_id = parseInt(productDetails.category_id);
      updatedProduct.new_price = parseFloat(productDetails.new_price);
      
      if (productDetails.old_price) {
        updatedProduct.old_price = parseFloat(productDetails.old_price);
      }
      
      // Upload tất cả ảnh đã thay đổi
      const uploadPromises = {};
      
      // Chỉ upload các ảnh đã chọn mới
      for (const [key, file] of Object.entries(images)) {
        if (file) {
          uploadPromises[key] = uploadSingleImage(file);
        }
      }
      
      // Đợi tất cả ảnh upload xong
      const uploadResults = {};
      
      for (const [key, promise] of Object.entries(uploadPromises)) {
        try {
          uploadResults[key] = await promise;
        } catch (error) {
          toast.error(`Lỗi khi tải ảnh ${key}: ${error.message}`);
          setSubmitting(false);
          return;
        }
      }
      
      // Cập nhật đường dẫn ảnh mới
      for (const [key, url] of Object.entries(uploadResults)) {
        if (url) {
          updatedProduct[key] = url;
        }
      }

      const response = await fetch(`${backend_url}/updateproduct/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update error:", errorText);
        throw new Error("Cập nhật sản phẩm thất bại");
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Sản phẩm đã được cập nhật thành công!");
        navigate('/listproduct');
      } else {
        throw new Error(result.message || "Cập nhật sản phẩm thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi cập nhật sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductDetails({ 
      ...productDetails, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Render image upload box
  const renderImageUpload = (key, label, isRequired = false) => {
    return (
      <div className="image-upload-box">
        <p>{label} {isRequired && <span className="required">*</span>}</p>
        <div className="image-preview-container">
          {imagePreviews[key] ? (
            <div className="image-preview">
              <img src={imagePreviews[key]} alt={`Preview ${key}`} />
              <button 
                type="button" 
                className="remove-image-btn"
                onClick={() => handleRemoveImage(key)}
                disabled={key === 'main' && isRequired}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ) : (
            <label htmlFor={`file-input-${key}`} className="upload-label">
              <div className="upload-placeholder">
                <FontAwesomeIcon icon={faUpload} className="upload-icon" />
                <p>Chọn ảnh</p>
              </div>
            </label>
          )}
        </div>
        <input 
          onChange={(e) => handleImageChange(e, key)}
          type="file" 
          id={`file-input-${key}`} 
          accept="image/*" 
          hidden 
        />
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Đang tải thông tin sản phẩm...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => navigate('/listproduct')}>Quay lại danh sách sản phẩm</button>
      </div>
    );
  }

  return (
    <div className="editproduct-container">
      <h2 className="editproduct-title">Chỉnh sửa sản phẩm</h2>
      
      <div className="editproduct-form">
        <div className="editproduct-main-section">
          <div className="editproduct-basic-info">
            <div className="editproduct-itemfield">
              <p>Tên sản phẩm <span className="required">*</span></p>
              <input 
                type="text" 
                name="name" 
                value={productDetails.name} 
                onChange={handleInputChange} 
                placeholder="Nhập tên sản phẩm" 
                required
              />
            </div>
            
            <div className="editproduct-itemfield">
              <p>Mô tả sản phẩm <span className="required">*</span></p>
              <textarea 
                name="description" 
                value={productDetails.description} 
                onChange={handleInputChange} 
                placeholder="Nhập mô tả sản phẩm"
                rows="4"
                required
              />
            </div>
            
            <div className="editproduct-price">
              <div className="editproduct-itemfield">
                <p>Giá gốc</p>
                <input 
                  type="number" 
                  name="old_price" 
                  value={productDetails.old_price} 
                  onChange={handleInputChange} 
                  placeholder="Nhập giá gốc" 
                />
              </div>
              <div className="editproduct-itemfield">
                <p>Giá bán <span className="required">*</span></p>
                <input 
                  type="number" 
                  name="new_price" 
                  value={productDetails.new_price} 
                  onChange={handleInputChange} 
                  placeholder="Nhập giá bán" 
                  required
                />
              </div>
            </div>
            
            <div className="editproduct-itemfield">
              <p>Danh mục sản phẩm <span className="required">*</span></p>
              <select 
                value={productDetails.category_id} 
                name="category_id" 
                className="editproduct-selector" 
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="editproduct-itemfield">
              <label className="editproduct-checkbox-label">
                <input 
                  type="checkbox" 
                  name="available" 
                  checked={productDetails.available} 
                  onChange={handleInputChange} 
                />
                Sản phẩm có sẵn để bán
              </label>
            </div>
          </div>
          
          <div className="editproduct-image-main">
            {renderImageUpload('main', 'Hình ảnh chính', true)}
          </div>
        </div>
        
        <div className="editproduct-additional-images">
          <h3>Hình ảnh phụ</h3>
          <div className="additional-images-grid">
            {renderImageUpload('image2', 'Hình ảnh phụ 1')}
            {renderImageUpload('image3', 'Hình ảnh phụ 2')}
            {renderImageUpload('image4', 'Hình ảnh phụ 3')}
            {renderImageUpload('image5', 'Hình ảnh phụ 4')}
            {renderImageUpload('image6', 'Hình ảnh phụ 5')}
          </div>
        </div>
        
        <div className="editproduct-buttons">
          <button 
            className="editproduct-cancel-btn" 
            onClick={() => navigate('/listproduct')}
          >
            HỦY
          </button>
          <button 
            className="editproduct-save-btn" 
            onClick={handleUpdateProduct} 
            disabled={submitting}
          >
            {submitting ? "ĐANG CẬP NHẬT..." : "LƯU THAY ĐỔI"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProduct; 