// Kích thước canvas tối đa
const maxHeight = 600, maxWidth = 800;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
// Ảnh gốc
var orgImg = null;
// Lịch sử chỉnh sửa (dùng để undo - hoàn tác)
var editHis = [];
// Lịch sử hoàn tác (dùng để redo - lặp lại)
var undoHis = [];

// Vẽ ảnh lên canvas
function applyImage(img_data) {
    canvas.width = img_data.width;
    canvas.height = img_data.height;
    context.putImageData(img_data, 0, 0);
    editHis.push(img_data);
}

// Tải ảnh lên
var uploadBtn = document.getElementById('uploadBtn');
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

            // Vẽ ảnh lên canvas
            canvas.width = width;
            canvas.height = height;
            context.drawImage(img, 0, 0, width, height);
            canvas.style.display = "block";

            // Đặt trạng thái gốc cho ảnh
            orgImg = context.getImageData(0, 0, canvas.width, canvas.height);
            editHis = [orgImg];
            redoHis = [];
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Tải ảnh về máy
var downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener("click", function () {
    const dataURL = canvas.toDataURL();
    const a = document.createElement("a");
    a.href = dataURL;
    const orgName = uploadBtn.files[0].name;
    var splitName = orgName.split('.');
    const editName = splitName[0] + "-edited." + splitName[1];
    a.download = editName;
    a.click();
});

// Hoàn tác
var undoBtn = document.getElementById('undoBtn');
undoBtn.addEventListener('click', function () {
    if (editHis.length > 1) {
        var currImg = editHis.pop();
        undoHis.push(currImg);
        var prevImg = editHis[editHis.length - 1];
        context.putImageData(prevImg, 0, 0);
    }
});

// Lặp lại
var redoBtn = document.getElementById('redoBtn');
redoBtn.addEventListener('click', function () {
    if (undoHis.length != 0) {
        var nextImg = undoHis.pop();
        editHis.push(nextImg);
        context.putImageData(nextImg, 0, 0);
    }
});

// Khôi phục gốc
var resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', function () {
    if (editHis.length > 1) {
        context.putImageData(orgImg, 0, 0);
        editHis = [orgImg];
        undoHis = [];
    }
});

// Làm xám
function grayscale(data, width, height) {
    const grayscale = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
        avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        for (let k = 0; k < 3; k++)
            grayscale[i + k] = avg;
        grayscale[i + 3] = 255;
    }
    return grayscale;
}

var grayBtn = document.getElementById('grayBtn');
grayBtn.addEventListener('click', function () {
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    var gray = grayscale(img.data, img.width, img.height);
    var grayImgData = new ImageData(gray, canvas.width, canvas.height);
    context.putImageData(grayImgData, 0, 0);
    editHis.push(grayImgData);
});

// Phát hiện biên cạnh
function detectEdges(img_data) {
    const data = img_data.data;
    const width = img_data.width;
    const height = img_data.height;

    // Chuyển sang ảnh xám
    const gray = grayscale(data, width, height);

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
                    sumX += gray[idx] * sobelX[(kx + 1) * 3 + ky + 1];
                    sumY += gray[idx] * sobelY[(kx + 1) * 3 + ky + 1];
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

var edgeBtn = document.getElementById('edgeBtn');
edgeBtn.addEventListener("click", function () {
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    var edgeImageData = new ImageData(detectEdges(img), canvas.width, canvas.height);
    context.putImageData(edgeImageData, 0, 0);
    editHis.push(edgeImageData);
});

// Chiếu sáng
var lightBtn = document.getElementById('lightBtn');
lightBtn.addEventListener('click', function () {
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
        for (let k = 0; k < 3; k++)
            img.data[i + k] += 20;
        img.data[i + 3] = 255;
    }
    var resImgData = new ImageData(img.data, canvas.width, canvas.height);
    context.putImageData(resImgData, 0, 0);
    editHis.push(resImgData);
});

// Xoay

// Vẽ

// Đối xứng


