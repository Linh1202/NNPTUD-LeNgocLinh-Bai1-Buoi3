// API URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 10;
let sortColumn = null; // 'title' or 'price'
let sortDirection = 'asc'; // 'asc' or 'desc'

// DOM Elements
const productsTableBody = document.getElementById('productsTableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const paginationContainer = document.getElementById('pagination');
const totalProductsEl = document.getElementById('totalProducts');
const totalCategoriesEl = document.getElementById('totalCategories');
const avgPriceEl = document.getElementById('avgPrice');
const pageSizeSelector = document.getElementById('pageSizeSelector');

// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        allProducts = await response.json();
        filteredProducts = [...allProducts];

        updateStats();
        populateCategoryFilter();
        renderProducts();
        renderPagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.
                </td>
            </tr>
        `;
    }
}

// Update statistics
function updateStats() {
    // Total products
    totalProductsEl.textContent = allProducts.length;

    // Unique categories
    const uniqueCategories = new Set(allProducts.map(p => p.category?.name || 'Unknown'));
    totalCategoriesEl.textContent = uniqueCategories.size;

    // Average price
    const avgPrice = allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length;
    avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categories = new Set();
    allProducts.forEach(product => {
        if (product.category && product.category.name) {
            categories.add(product.category.name);
        }
    });

    categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Sort products
function sortProducts(column) {
    // Toggle direction if same column, otherwise reset to asc
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredProducts.sort((a, b) => {
        let valueA, valueB;

        if (column === 'title') {
            valueA = (a.title || '').toLowerCase();
            valueB = (b.title || '').toLowerCase();
        } else if (column === 'price') {
            valueA = a.price || 0;
            valueB = b.price || 0;
        }

        if (sortDirection === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });

    currentPage = 1; // Reset to first page
    renderProducts();
    renderPagination();
    updateSortIcons();
}

// Update sort icons in table headers
function updateSortIcons() {
    // Reset all sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.className = 'sort-icon bi bi-arrow-down-up';
    });

    // Update active column icon
    if (sortColumn) {
        const activeIcon = document.querySelector(`[data-sort="${sortColumn}"] .sort-icon`);
        if (activeIcon) {
            activeIcon.className = sortDirection === 'asc'
                ? 'sort-icon bi bi-sort-alpha-down active'
                : 'sort-icon bi bi-sort-alpha-up-alt active';

            if (sortColumn === 'price') {
                activeIcon.className = sortDirection === 'asc'
                    ? 'sort-icon bi bi-sort-numeric-down active'
                    : 'sort-icon bi bi-sort-numeric-up-alt active';
            }
        }
    }
}

// Export to CSV
function exportToCSV() {
    if (filteredProducts.length === 0) {
        alert('Không có dữ liệu để export!');
        return;
    }

    // CSV Header
    const headers = ['ID', 'Title', 'Price', 'Category', 'Description'];

    // Convert products to CSV rows
    const csvRows = [];
    csvRows.push(headers.join(','));

    filteredProducts.forEach(product => {
        const row = [
            product.id || '',
            `"${(product.title || '').replace(/"/g, '""')}"`, // Escape quotes
            product.price || 0,
            `"${(product.category?.name || 'N/A').replace(/"/g, '""')}"`,
            `"${(product.description || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
    });

    // Create CSV string
    const csvString = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message
    showExportSuccess();
}

// Show export success message
function showExportSuccess() {
    const message = document.createElement('div');
    message.className = 'export-success-message';
    message.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        Export thành công! Đã tải xuống ${filteredProducts.length} sản phẩm.
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.classList.add('show');
    }, 100);

    setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);
}

// Current product being viewed/edited
let currentProduct = null;

// Show product detail modal
function showProductDetail(product) {
    currentProduct = product;

    // Populate form fields
    document.getElementById('productId').value = product.id || '';
    document.getElementById('productTitle').value = product.title || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.category?.name || 'N/A';
    document.getElementById('productDescription').value = product.description || '';

    // Display images
    const imagesContainer = document.getElementById('productImages');
    if (product.images && product.images.length > 0) {
        imagesContainer.innerHTML = product.images.map(img => {
            const cleanImg = img.replace(/[\[\]"]/g, '');
            return `<img src="${cleanImg}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/120'">`;
        }).join('');
    } else {
        imagesContainer.innerHTML = '<p class="text-muted">Không có hình ảnh</p>';
    }

    // Hide message
    document.getElementById('modalMessage').classList.add('d-none');

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Save product changes
async function saveProduct() {
    if (!currentProduct) return;

    const saveBtn = document.getElementById('saveProductBtn');
    const messageEl = document.getElementById('modalMessage');

    // Get form values
    const updatedProduct = {
        title: document.getElementById('productTitle').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value
    };

    // Validate
    if (!updatedProduct.title || !updatedProduct.price || !updatedProduct.description) {
        showModalMessage('Vui lòng điền đầy đủ thông tin!', 'danger');
        return;
    }

    // Show loading
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Đang lưu...';

    try {
        const response = await fetch(`https://api.escuelajs.co/api/v1/products/${currentProduct.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
            throw new Error('Failed to update product');
        }

        const result = await response.json();

        // Update local data
        const productIndex = allProducts.findIndex(p => p.id === currentProduct.id);
        if (productIndex !== -1) {
            allProducts[productIndex] = { ...allProducts[productIndex], ...updatedProduct };
        }

        const filteredIndex = filteredProducts.findIndex(p => p.id === currentProduct.id);
        if (filteredIndex !== -1) {
            filteredProducts[filteredIndex] = { ...filteredProducts[filteredIndex], ...updatedProduct };
        }

        // Refresh display
        renderProducts();

        // Show success message
        showModalMessage('✅ Cập nhật sản phẩm thành công!', 'success');

        // Close modal after 1.5 seconds
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        }, 1500);

    } catch (error) {
        console.error('Error updating product:', error);
        showModalMessage('❌ Có lỗi xảy ra khi cập nhật sản phẩm!', 'danger');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-save me-2"></i>Lưu thay đổi';
    }
}

// Show message in modal
function showModalMessage(message, type) {
    const messageEl = document.getElementById('modalMessage');
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    messageEl.classList.remove('d-none');
}

// Create new product
async function createNewProduct() {
    const submitBtn = document.getElementById('createProductSubmitBtn');
    const messageEl = document.getElementById('createModalMessage');

    // Get form values
    const newProduct = {
        title: document.getElementById('newProductTitle').value.trim(),
        price: parseFloat(document.getElementById('newProductPrice').value),
        description: document.getElementById('newProductDescription').value.trim(),
        categoryId: parseInt(document.getElementById('newProductCategoryId').value),
        images: [document.getElementById('newProductImages').value.trim()]
    };

    // Validate
    if (!newProduct.title || !newProduct.price || !newProduct.description || !newProduct.categoryId || !newProduct.images[0]) {
        showCreateModalMessage('Vui lòng điền đầy đủ thông tin!', 'danger');
        return;
    }

    if (newProduct.price <= 0) {
        showCreateModalMessage('Giá sản phẩm phải lớn hơn 0!', 'danger');
        return;
    }

    // Show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Đang tạo...';

    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) {
            throw new Error('Failed to create product');
        }

        const createdProduct = await response.json();

        // Add to local data
        allProducts.unshift(createdProduct);
        filteredProducts.unshift(createdProduct);

        // Refresh display
        currentPage = 1;
        renderProducts();
        renderPagination();
        updateStats();

        // Show success message
        showCreateModalMessage('✅ Tạo sản phẩm thành công!', 'success');

        // Clear form
        document.getElementById('createProductForm').reset();

        // Close modal after 1.5 seconds
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('createProductModal')).hide();
        }, 1500);

    } catch (error) {
        console.error('Error creating product:', error);
        showCreateModalMessage('❌ Có lỗi xảy ra khi tạo sản phẩm!', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Tạo sản phẩm';
    }
}

// Show message in create modal
function showCreateModalMessage(message, type) {
    const messageEl = document.getElementById('createModalMessage');
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    messageEl.classList.remove('d-none');
}

// Render products table
function renderProducts() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <i class="bi bi-inbox me-2"></i>
                    Không tìm thấy sản phẩm nào.
                </td>
            </tr>
        `;
        return;
    }

    productsTableBody.innerHTML = productsToShow.map(product => {
        const imageUrl = product.images && product.images.length > 0
            ? product.images[0].replace(/[\[\]"]/g, '')
            : 'https://via.placeholder.com/60';

        const categoryName = product.category?.name || 'N/A';
        const price = product.price ? `$${product.price.toFixed(2)}` : 'N/A';
        const description = product.description || 'Không có mô tả cho sản phẩm này.';

        // Highlight search term in title
        const searchTerm = searchInput.value.trim();
        const displayTitle = highlightSearchTerm(product.title || 'Untitled', searchTerm);

        return `
            <tr class="product-row" data-description="${description.replace(/"/g, '&quot;')}" data-product-id="${product.id}">
                <td>
                    <span class="id-badge">#${product.id}</span>
                </td>
                <td>
                    <img src="${imageUrl}" 
                         alt="${product.title}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/60'">
                </td>
                <td>
                    <h6 class="product-title">${displayTitle}</h6>
                </td>
                <td>
                    <span class="price-badge">${price}</span>
                </td>
                <td>
                    <span class="category-badge">${categoryName}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="1">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Debounce function for optimized search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter products
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.title?.toLowerCase().includes(searchTerm) || false;
        const matchesCategory = selectedCategory === '' || product.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    currentPage = 1;
    renderProducts();
    renderPagination();
    updateSearchStats();
}

// Update search statistics
function updateSearchStats() {
    const searchTerm = searchInput.value.trim();
    const statsContainer = document.getElementById('searchStats');

    if (searchTerm && statsContainer) {
        const resultsText = filteredProducts.length === 1
            ? '1 kết quả'
            : `${filteredProducts.length} kết quả`;
        statsContainer.innerHTML = `
            <small class="text-muted">
                <i class="bi bi-search me-1"></i>
                Tìm thấy <strong>${resultsText}</strong> cho "${searchTerm}"
            </small>
        `;
        statsContainer.style.display = 'block';
    } else if (statsContainer) {
        statsContainer.style.display = 'none';
    }
}

// Highlight search term in product title
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}


// Event Listeners
const debouncedSearch = debounce(filterProducts, 300);
searchInput.addEventListener('input', debouncedSearch);
categoryFilter.addEventListener('change', filterProducts);

// Page size change handler
if (pageSizeSelector) {
    pageSizeSelector.addEventListener('change', (e) => {
        productsPerPage = parseInt(e.target.value);
        currentPage = 1; // Reset to first page
        renderProducts();
        renderPagination();
    });
}

// Sort button event listeners
document.addEventListener('click', (e) => {
    const sortHeader = e.target.closest('.sortable-header');
    if (sortHeader) {
        const column = sortHeader.dataset.sort;
        sortProducts(column);
    }

    // Export CSV button handler
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
});

paginationContainer.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.tagName === 'A' || e.target.tagName === 'I') {
        const link = e.target.tagName === 'A' ? e.target : e.target.parentElement;
        const page = parseInt(link.dataset.page);

        if (page && !isNaN(page)) {
            currentPage = page;
            renderProducts();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', fetchProducts);

// Product row click handler - Open modal
productsTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('.product-row');
    if (row) {
        const productId = parseInt(row.dataset.productId);
        const product = filteredProducts.find(p => p.id === productId);
        if (product) {
            showProductDetail(product);
        }
    }
});

// Save product button handler
const saveProductBtn = document.getElementById('saveProductBtn');
if (saveProductBtn) {
    saveProductBtn.addEventListener('click', saveProduct);
}

// Create product button handlers
const createProductBtn = document.getElementById('createProductBtn');
if (createProductBtn) {
    createProductBtn.addEventListener('click', () => {
        // Clear form and message
        document.getElementById('createProductForm').reset();
        document.getElementById('createModalMessage').classList.add('d-none');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('createProductModal'));
        modal.show();
    });
}

const createProductSubmitBtn = document.getElementById('createProductSubmitBtn');
if (createProductSubmitBtn) {
    createProductSubmitBtn.addEventListener('click', createNewProduct);
}

// Tooltip functionality
const tooltip = document.getElementById('descriptionTooltip');
const tooltipContent = document.getElementById('tooltipContent');

// Show tooltip on mouseenter
document.addEventListener('mouseenter', (e) => {
    if (e.target.closest('.product-row')) {
        const row = e.target.closest('.product-row');
        const description = row.dataset.description;

        if (description) {
            tooltipContent.textContent = description;
            tooltip.classList.add('show');
            updateTooltipPosition(e);
        }
    }
}, true);

// Update tooltip position on mousemove
document.addEventListener('mousemove', (e) => {
    if (tooltip.classList.contains('show')) {
        updateTooltipPosition(e);
    }
});

// Hide tooltip on mouseleave
document.addEventListener('mouseleave', (e) => {
    if (e.target.closest('.product-row')) {
        tooltip.classList.remove('show');
    }
}, true);

// Function to update tooltip position
function updateTooltipPosition(e) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 15;

    let left = e.clientX + padding;
    let top = e.clientY + padding;

    // Check if tooltip goes off right edge
    if (left + tooltipRect.width > window.innerWidth) {
        left = e.clientX - tooltipRect.width - padding;
    }

    // Check if tooltip goes off bottom edge
    if (top + tooltipRect.height > window.innerHeight) {
        top = e.clientY - tooltipRect.height - padding;
    }

    // Ensure tooltip doesn't go off left edge
    if (left < padding) {
        left = padding;
    }

    // Ensure tooltip doesn't go off top edge
    if (top < padding) {
        top = padding;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}
