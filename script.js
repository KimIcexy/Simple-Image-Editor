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
function rotateImage(degrees) {
    var radians = degrees * Math.PI / 180;

    // Tạo một canvas tạm thời để chứa ảnh đã xoay
    var tempCanvas = document.createElement("canvas");
    var tempContext = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Di chuyển tâm canvas về giữa --> xoay ảnh xung quanh tâm
    tempContext.translate(canvas.width / 2, canvas.height / 2);
    tempContext.rotate(radians);

    // Di chuyển tâm canvas trở lại vị trí ban đầu
    tempContext.translate(-canvas.width / 2, -canvas.height / 2);

    // Vẽ ảnh gốc lên canvas tạm
    tempContext.drawImage(canvas, 0, 0);

    // Xóa nội dung trên canvas cũ
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ ảnh đã xoay từ canvas tạm lên canvas gốc
    context.drawImage(tempCanvas, 0, 0);
}

// Bắt sự kiện khi nhấn vào nút "Xoay ảnh"
var rotateBtn = document.getElementById("rotateBtn");
rotateBtn.addEventListener("click", function () {
    var degrees = prompt("Nhập góc xoay (độ):");
    if (degrees) {
        rotateImage(parseFloat(degrees));
    }
});

// Vẽ
document.addEventListener("DOMContentLoaded", function () {
    var drawBtn = document.getElementById("drawBtn");
    var isDrawing = false;

    // Bắt sự kiện khi nhấn vào nút "Nét vẽ"
    drawBtn.addEventListener("click", function () {
        // Bắt sự kiện khi nhấn chuột trái trên canvas
        canvas.addEventListener("mousedown", function (e) {
            if (e.button === 0) { // Kiểm tra nút chuột nhấn là chuột trái
                isDrawing = true;
                startDrawing();
            }
        });
    });

    // Bắt sự kiện khi di chuyển chuột trên canvas
    canvas.addEventListener("mousemove", function (e) {
        if (isDrawing) { // Kiểm tra nếu đang giữ chuột trái
            draw(e);
        }
    });

    // Bắt sự kiện khi thả chuột trái khỏi canvas
    canvas.addEventListener("mouseup", function (e) {
        if (e.button === 0) { // Kiểm tra nút chuột nhả là chuột trái
            isDrawing = false;
            stopDrawing();
        }
    });

    // Bắt sự kiện khi di chuột ra khỏi canvas
    canvas.addEventListener("mouseout", function (e) {
        if (e.button === 0) { // Kiểm tra nút chuột nhấn là chuột trái
            isDrawing = false;
            stopDrawing();
        }
    });


    function startDrawing(e) {
        if (!isDrawing) return;
        context.beginPath();
        context.moveTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
    }

    function draw(e) {
        if (!isDrawing) return;
        context.lineTo(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        context.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
        editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
    }
});


// Đối xứng
function flipImage() {
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var flippedData = context.createImageData(imageData);

    for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
            var sourceIndex = (y * canvas.width + x) * 4;
            var targetIndex = (y * canvas.width + (canvas.width - x - 1)) * 4;

            flippedData.data[targetIndex] = imageData.data[sourceIndex];
            flippedData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
            flippedData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
            flippedData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
        }
    }

    context.putImageData(flippedData, 0, 0);
}

var flipBtn = document.getElementById("flipBtn");
flipBtn.addEventListener("click", function () {
    flipImage();
});