var canvas = document.getElementById('canvas');
var imageInput = document.getElementById('imageInput');
const maxHeight = 600, maxWidth = 800
const downloadBtn = document.getElementById('downloadBtn');

// Lắng nghe sự kiện khi tải ảnh lên
imageInput.addEventListener('change', function (e) {
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