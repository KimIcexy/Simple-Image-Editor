var canvasElement = document.getElementById('canvas');
var imageInput = document.getElementById('imageInput');
const maxHeight = 600, maxWidth = 800
const downloadBtn = document.getElementById('downloadBtn');
var ctx = canvasElement.getContext('2d');
var img = new Image();


var croppedImage = null;
var currentImage = null;
var originalImage = null;




// Biến lưu trữ tọa độ khung cắt
var startX, startY, endX, endY;
var isDragging = false;

// Sự kiện khi chuột được nhấn xuống trên canvas
canvas.addEventListener('mousedown', function(e) {
  startX = e.offsetX;
  startY = e.offsetY;
  isDragging = true;
});

// Sự kiện khi chuột được di chuyển trên canvas
canvas.addEventListener('mousemove', function(e) {
  if (isDragging) {
    drawCropRect(startX, startY, e.offsetX, e.offsetY);
  }
});

// Sự kiện khi chuột được nhấc lên trên canvas
canvas.addEventListener('mouseup', function(e) {
  if (isDragging) {
    isDragging = false;
    endX = e.offsetX;
    endY = e.offsetY;
    drawCropRect(startX, startY, endX, endY);
    cropImage(startX, startY, endX, endY);
  }
});

// Hàm vẽ khung cắt trên canvas
function drawCropRect(x1, y1, x2, y2) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}
// Hàm cắt ảnh dựa trên khung đã vẽ
function cropImage(x1, y1, x2, y2) {
  var croppedWidth = x2 - x1;
  var croppedHeight = y2 - y1;
  var croppedData = ctx.getImageData(x1, y1, croppedWidth, croppedHeight);

  // Đưa ảnh đã cắt vào canvas mới
  var newCanvas = document.createElement('canvas');
  var newCtx = newCanvas.getContext('2d');
  newCanvas.width = croppedWidth;
  newCanvas.height = croppedHeight;
  newCtx.putImageData(croppedData, 0, 0);

  // Lưu trữ ảnh đã cắt
  croppedImage = new Image();
  croppedImage.onload = function() {
    // Áp dụng các tính năng chỉnh sửa cho ảnh đã cắt
    applyFilters();
  };
  croppedImage.src = newCanvas.toDataURL();
}

// Áp dụng các tính năng chỉnh sửa ảnh
function applyFilters() {
    // Lấy giá trị các thuộc tính
    var blurAmount = document.getElementById('blurAmount').value;
    var grayscale = document.getElementById('grayscale').checked;
    var contrastAmount = document.getElementById('contrastAmount').value;
  
    // Đưa ảnh gốc lên canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Kiểm tra nếu có ảnh đã cắt
    if (croppedImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(croppedImage, 0, 0, canvas.width, canvas.height);
    }
    
    // 1. Làm trơn ảnh
    ctx.filter = `blur(${blurAmount}px)`;

    // 2. Làm xám ảnh (grayscale)
    if (grayscale) {
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;

        for (var i = 0; i < pixels.length; i += 4) {
        var average = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = average;           // Kênh đỏ
        pixels[i + 1] = average;       // Kênh xanh lá cây
        pixels[i + 2] = average;       // Kênh xanh dương
        }

        ctx.putImageData(imageData, 0, 0);
    }
    // 3. Điều chỉnh contrast
    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
    tempCtx.filter = `contrast(${contrastAmount})`;
    tempCtx.drawImage(canvasElement, 0, 0);
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
  
// Lắng nghe sự kiện khi tải ảnh lên
imageInput.addEventListener('change', function (e) {
  var file = e.target.files[0];
  var reader = new FileReader();

  reader.onload = function (event) {
    img.onload = function () {
      var width = img.width;
      var height = img.height;

      // Tính toán kích thước mới Dựa trên maxWidth và maxHeight:
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
      canvasElement.width = width;
      canvasElement.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvasElement.style.display = "block";
      
      // Áp dụng các tính năng khi người dùng thay đổi giá trị
      applyFilters();
      };
      img.src = event.target.result;
      };
      
      reader.readAsDataURL(file);
      });
      
      // Lắng nghe sự kiện khi tải ảnh xuống
      downloadBtn.addEventListener("click", function () {
      const dataURL = canvasElement.toDataURL();
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "edited-image.png";
      a.click();
      });
      
      // Sự kiện khi người dùng thay đổi giá trị của các thuộc tính
      var inputs = document.querySelectorAll('input[type="range"], input[type="checkbox"]');
      inputs.forEach(function(input) {
        input.addEventListener('input', function() {
          applyFilters();
        });
      });
      
      // Sự kiện khi người dùng nhấp vào nút "Áp dụng các tính năng"
      var applyButton = document.querySelector('button');
      applyButton.addEventListener('click', function() {
        applyFilters();
      });
      
