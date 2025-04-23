import React, { useState, useEffect } from "react";
import "./AddProduct.css";
import upload_area from "../Assets/upload_area.svg";
import { backend_url } from "../../App";
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";

const AddProduct = () => {
  const [mainImage, setMainImage] = useState(null);
  const [images, setImages] = useState({
    main: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    main: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    category_id: "",
    new_price: "",
    old_price: ""
  });

  // Lấy danh sách danh mục khi component được tải
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${backend_url}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          // Đặt giá trị mặc định cho category_id (danh mục đầu tiên)
          if (data.length > 0) {
            setProductDetails(prev => ({...prev, category_id: data[0].id.toString()}));
          }
        } else {
          console.error("Không thể tải danh sách danh mục");
        }
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

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
    setImages(prev => ({
      ...prev,
      [imageKey]: null
    }));
    
    setImagePreviews(prev => ({
      ...prev,
      [imageKey]: null
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

  const handleAddProduct = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!productDetails.name || !productDetails.description || !images.main || !productDetails.category_id || !productDetails.new_price) {
      toast.error("Vui lòng điền đầy đủ thông tin sản phẩm và ảnh chính");
      return;
    }

    try {
      setLoading(true);
      
      // Upload tất cả ảnh
      const uploadPromises = {};
      
      // Chỉ upload các ảnh đã chọn
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
          setLoading(false);
          return;
        }
      }
      
      // Tạo sản phẩm mới
      const productData = {
        name: productDetails.name,
        description: productDetails.description,
        image: uploadResults.main,
        image2: uploadResults.image2 || null,
        image3: uploadResults.image3 || null,
        image4: uploadResults.image4 || null,
        image5: uploadResults.image5 || null,
        image6: uploadResults.image6 || null,
        category_id: parseInt(productDetails.category_id),
        new_price: parseFloat(productDetails.new_price),
        old_price: productDetails.old_price ? parseFloat(productDetails.old_price) : null
      };

      const createResponse = await fetch(`${backend_url}/addproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("Create product error:", errorText);
        throw new Error("Thêm sản phẩm thất bại");
      }

      const createData = await createResponse.json();
      if (createData.success) {
        toast.success("Thêm sản phẩm thành công!");
        
        // Reset form
        setImages({
          main: null,
          image2: null,
          image3: null,
          image4: null,
          image5: null,
          image6: null
        });
        setImagePreviews({
          main: null,
          image2: null,
          image3: null,
          image4: null,
          image5: null,
          image6: null
        });
        setProductDetails({
          name: "",
          description: "",
          category_id: categories.length > 0 ? categories[0].id.toString() : "",
          new_price: "",
          old_price: ""
        });
      } else {
        throw new Error(createData.message || "Thêm sản phẩm thất bại");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi thêm sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductDetails({ ...productDetails, [name]: value });
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

  return (
    <div className="addproduct-container">
      <h2 className="addproduct-title">Thêm Sản Phẩm Mới</h2>
      
      <div className="addproduct-form">
        <div className="addproduct-main-section">
          <div className="addproduct-basic-info">
            <div className="addproduct-itemfield">
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
            
            <div className="addproduct-itemfield">
              <p>Mô tả sản phẩm <span className="required">*</span></p>
              <textarea 
                name="description" 
                value={productDetails.description} 
                onChange={handleInputChange}
                placeholder="Nhập mô tả sản phẩm" 
                rows={4}
                required 
              />
            </div>
            
            <div className="addproduct-price">
              <div className="addproduct-itemfield">
                <p>Giá gốc</p>
                <input 
                  type="number" 
                  name="old_price" 
                  value={productDetails.old_price} 
                  onChange={handleInputChange}
                  placeholder="Nhập giá gốc" 
                />
              </div>
              <div className="addproduct-itemfield">
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
            
            <div className="addproduct-itemfield">
              <p>Danh mục <span className="required">*</span></p>
              <select 
                value={productDetails.category_id} 
                name="category_id" 
                className="add-product-selector" 
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
          </div>
          
          <div className="addproduct-image-main">
            {renderImageUpload('main', 'Hình ảnh chính', true)}
          </div>
        </div>
        
        <div className="addproduct-additional-images">
          <h3>Hình ảnh phụ</h3>
          <div className="additional-images-grid">
            {renderImageUpload('image2', 'Hình ảnh phụ 1')}
            {renderImageUpload('image3', 'Hình ảnh phụ 2')}
            {renderImageUpload('image4', 'Hình ảnh phụ 3')}
            {renderImageUpload('image5', 'Hình ảnh phụ 4')}
            {renderImageUpload('image6', 'Hình ảnh phụ 5')}
          </div>
        </div>
        
        <button 
          className="addproduct-btn" 
          onClick={handleAddProduct}
          disabled={loading}
        >
          {loading ? "ĐANG XỬ LÝ..." : "THÊM SẢN PHẨM"}
        </button>
      </div>
    </div>
  );
};

export default AddProduct;
