var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var uploadBtn = document.getElementById('imageInput');
const maxHeight = 600, maxWidth = 800;
var downloadBtn = document.getElementById('downloadBtn');
var edgeBtn = document.getElementById('edgeBtn');


// Lắng nghe sự kiện khi tải ảnh lên
uploadBtn.addEventListener('change', function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();

    reader.onload = function (event) {
        var img = new Image();
        img.onload = function () {
            var width = img.width;
            var height = img.height;

            // Tính toán kích thước mới dựa trên maxWidth và maxHeight
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            // Vẽ ảnh lên canvas sau khi đã chuyển đổi kích thước
            canvas.width = width;
            canvas.height = height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0, width, height);
            canvas.style.display = "block";
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

// Lắng nghe sự kiện khi tải ảnh xuống
downloadBtn.addEventListener("click", function () {
    const dataURL = canvas.toDataURL();
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "edited-image.png";
    a.click();
});

// Lọc biên cạnh
edgeBtn.addEventListener("click", function () {
    // Lấy dữ liệu hình ảnh từ canvas
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    // Phát hiện biên cạnh của ảnh
    var edgeImageData = new ImageData(detectEdges(img), canvas.width, canvas.height);
    context.putImageData(edgeImageData, 0, 0);
});

// Phát hiện biên cạnh của ảnh
function detectEdges(img) {
    const data = img.data;
    const width = img.width;
    const height = img.height;

    // Chuyển sang ảnh xám
    const grayscale = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
        avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        for (let k = 0; k < 3; k++)
            grayscale[i + k] = avg;
        grayscale[i + 3] = 255
    }

    // Áp dụng bộ lọc Sobel để phát hiện biên cạnh
    const result = new Uint8ClampedArray(width * height * 4);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    const step_y = width * 4;

    for (let x = 1; x < width - 1; x++) {
        for (let y = 1; y < height - 1; y++) {
            let sumX = 0;
            let sumY = 0;
            // Nhân tích chập với bộ lọc
            for (let kx = -1; kx <= 1; kx++) {
                for (let ky = -1; ky <= 1; ky++) {
                    const row = y + ky;
                    const col = x + kx;
                    let idx = row * step_y + col * 4;
                    sumX += grayscale[idx] * sobelX[(kx + 1) * 3 + ky + 1];
                    sumY += grayscale[idx] * sobelY[(kx + 1) * 3 + ky + 1];
                }
            }
            // Lưu kết quả vào result
            const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
            let idx = y * step_y + x * 4;
            for (let k = 0; k < 3; k++)
                result[idx + k] = magnitude;
            result[idx + 3] = 255;
        }
    }
    return result;
}