// Kích thước canvas tối đa
const maxHeight = 600, maxWidth = 800;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var img = context.getImageData(0, 0, canvas.width, canvas.height);
// Ảnh gốc
var orgImg = null;
// Lịch sử chỉnh sửa (dùng để undo - hoàn tác)
var editHis = [];
// Lịch sử hoàn tác (dùng để redo - lặp lại)
var undoHis = [];

// CÁC NÚT ĐIỀU KHIỂN
{
    // Tải ảnh lên
    {
        var uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.addEventListener('change', function (e) {
            var file = e.target.files[0];
            var reader = new FileReader();

            reader.onload = function (event) {
                let img = new Image();
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
    }


    // Tải ảnh về máy
    {
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
    }

    // Hoàn tác 
    {
        var undoBtn = document.getElementById('undoBtn');
        undoBtn.addEventListener('click', function () {
            if (editHis.length > 1) {
                var currImg = editHis.pop();
                undoHis.push(currImg);
                var prevImg = editHis[editHis.length - 1];
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Kiểm tra kích thước ảnh prevImg với kích thước canvas hiện tại
                if (prevImg.width !== canvas.width || prevImg.height !== canvas.height) {
                    // Cập nhật kích thước canvas
                    canvas.width = prevImg.width;
                    canvas.height = prevImg.height;
                }

                context.putImageData(prevImg, 0, 0);
            }
        });
    }



    // Lặp lại
    {
        var redoBtn = document.getElementById('redoBtn');
        redoBtn.addEventListener('click', function () {
            if (undoHis.length != 0) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                var nextImg = undoHis.pop();
                editHis.push(nextImg);
                context.putImageData(nextImg, 0, 0);
            }
        });
    }


    // Khôi phục gốc
    {
        var resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', function () {
            if (editHis.length > 1) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Kiểm tra kích thước ảnh prevImg với kích thước canvas hiện tại
                if (orgImg.width !== canvas.width || orgImg.height !== canvas.height) {
                    // Cập nhật kích thước canvas
                    canvas.width = orgImg.width;
                    canvas.height = orgImg.height;
                }
                context.putImageData(orgImg, 0, 0);
                editHis = [orgImg];
                undoHis = [];
            }
        });
    }
}

// CÁC NÚT CHỨC NĂNG
{
    // Làm trơn
    {
        // Lấy tham chiếu đến phần tử có id là 'blurSlider'
        var blurSlider = document.getElementById('blurSlider');
    
        // Gắn sự kiện 'change' vào thanh trượt
        blurSlider.addEventListener('change', function () {
            // Thiết lập hiệu ứng mờ bằng cách sử dụng giá trị của thanh trượt
            context.filter = `blur(${blurSlider.value}px)`;
    
            // Vẽ lại canvas để áp dụng hiệu ứng
            context.drawImage(canvas, 0, 0);
    
            // Lưu trạng thái hiện tại của canvas vào mảng 'editHis'
            editHis.push(canvas.getImageData(0, 0, canvas.width, canvas.height));
        });
    }


    // Làm xám
    {
        // Hàm GrayScale nhận vào mảng dữ liệu hình ảnh (data), chiều rộng (width) và chiều cao (height)
        function GrayScale(data, width, height) {
            // Tạo một mảng mới với độ dài là width * height * 4 (vì mỗi pixel có 4 giá trị: R, G, B, A)
            const grayscale = new Uint8ClampedArray(width * height * 4);
    
            // Lặp qua từng pixel trong mảng dữ liệu
            for (let i = 0; i < data.length; i += 4) {
                // Tính giá trị trung bình của các thành phần R, G, B để chuyển đổi sang ảnh xám
                avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
                // Đặt giá trị trung bình cho thành phần R, G, B của pixel
                for (let k = 0; k < 3; k++)
                    grayscale[i + k] = avg;
    
                // Đặt giá trị 255 cho thành phần Alpha (A) của pixel để giữ nguyên độ trong suốt
                grayscale[i + 3] = 255;
            }
    
            // Trả về mảng dữ liệu ảnh xám
            return grayscale;
        }
    
        // Lấy tham chiếu đến phần tử có id là 'grayBtn'
        var grayBtn = document.getElementById('grayBtn');
    
        // Gắn sự kiện 'click' vào nút ảnh xám
        grayBtn.addEventListener('click', function () {
            // Lấy dữ liệu ảnh từ canvas
            img = context.getImageData(0, 0, canvas.width, canvas.height);
    
            // Chuyển đổi dữ liệu ảnh sang ảnh xám
            var gray = GrayScale(img.data, img.width, img.height);
    
            // Tạo một đối tượng ImageData mới từ dữ liệu ảnh xám và kích thước của canvas
            var grayImgData = new ImageData(gray, canvas.width, canvas.height);
    
            // Vẽ lại canvas với dữ liệu ảnh xám
            context.putImageData(grayImgData, 0, 0);
    
            // Lưu trạng thái hiện tại của canvas vào mảng 'editHis'
            editHis.push(grayImgData);
        });
    }


    // Phát hiện biên cạnh
    {
        function DetectEdges(img_data) {
            const data = img_data.data;
            const width = img_data.width;
            const height = img_data.height;

            // Chuyển sang ảnh xám
            const gray = GrayScale(data, width, height);

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
            img = context.getImageData(0, 0, canvas.width, canvas.height);
            var edgeImageData = new ImageData(DetectEdges(img), canvas.width, canvas.height);
            context.putImageData(edgeImageData, 0, 0);
            editHis.push(edgeImageData);
        });
    }


    // Chiếu sáng
    {
        var lightSlider = document.getElementById('lightSlider');
        lightSlider.addEventListener('change', function () {
            img = context.getImageData(0, 0, canvas.width, canvas.height);
            var data = img.data;
            var value = Number(lightSlider.value);

            for (let i = 0; i < img.data.length; i += 4) {
                for (let k = 0; k < 3; k++)
                    data[i + k] += value;
            }
            var resImgData = new ImageData(img.data, canvas.width, canvas.height);
            context.putImageData(resImgData, 0, 0);
            editHis.push(resImgData);
        });

    }
    //Tương phảm
    {
        // Lấy tham chiếu đến phần tử có id là 'contrastSlider'
        var contrastSlider = document.getElementById('contrastSlider');
    
        // Gắn sự kiện 'change' vào thanh trượt độ tương phản
        contrastSlider.addEventListener('change', function () {
            // Lấy dữ liệu ảnh từ canvas
            img = context.getImageData(0, 0, canvas.width, canvas.height);
            var data = img.data;
            var value = Number(contrastSlider.value);
    
            // Lặp qua từng pixel trong mảng dữ liệu ảnh
            for (let i = 0; i < img.data.length; i += 4) {
                // Tăng độ tương phản của thành phần R, G, B của pixel
                for (let k = 0; k < 3; k++)
                    data[i + k] *= value;
            }
    
            // Tạo một đối tượng ImageData mới từ mảng dữ liệu ảnh đã thay đổi và kích thước của canvas
            var resImgData = new ImageData(img.data, canvas.width, canvas.height);
    
            // Vẽ lại canvas với dữ liệu ảnh đã thay đổi
            context.putImageData(resImgData, 0, 0);
    
            // Lưu trạng thái hiện tại của canvas vào mảng 'editHis'
            editHis.push(resImgData);
        });
    }

    // Xoay
    {
        function RotateImage(degrees) {
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
                RotateImage(parseFloat(degrees));
            }
        });
    }

    // Cắt
    {
        // Khởi tạo biến để lưu thông tin về vùng cắt
        var cropRect = { x: 0, y: 0, width: 0, height: 0 };
        var isCropping = false; // Biến để kiểm tra xem có đang trong quá trình cắt hay không
        var cropRectVisible = false; // Biến để kiểm tra xem vùng cắt có hiển thị hay không
        var isMouseMoving = false; // Biến để kiểm tra xem con trỏ chuột có đang di chuyển hay không
        var tempImg = null; // Biến để lưu ảnh gốc khi cắt

        // Lấy phần tử nút cắt từ DOM
        var cropBtn = document.getElementById('cropBtn');
        
        // Thêm sự kiện click vào nút cắt
        cropBtn.addEventListener('click', function () {
            // Chuyển đổi trạng thái cắt ảnh
            isCropping = !isCropping;
            if (isCropping) {
                // Đặt con trỏ chuột thành kiểu crosshair để chỉ định chế độ cắt ảnh
                canvas.style.cursor = "crosshair";
                
                // Xử lý sự kiện mousedown trên canvas để bắt đầu quá trình cắt ảnh
                canvas.addEventListener('mousedown', onMouseDown);
            }
        });

        // Xử lý sự kiện khi chuột được nhấn xuống trên canvas
        function onMouseDown(e) {
            if (isCropping) {
                // Lưu tọa độ ban đầu của vùng cắt dựa trên tọa độ chuột
                cropRect.x = e.clientX - canvas.getBoundingClientRect().left;
                cropRect.y = e.clientY - canvas.getBoundingClientRect().top;

                // Thêm sự kiện mousemove và mouseup để xử lý việc di chuyển chuột và kích thước vùng cắt
                canvas.addEventListener('mousemove', onMouseMove);
                canvas.addEventListener('mouseup', onMouseUp);

                // Đánh dấu hiển thị vùng cắt và lưu ảnh gốc vào biến tạm
                cropRectVisible = true;
                tempImg = new Image();
                tempImg.src = canvas.toDataURL(); // Lưu ảnh gốc vào biến tạm
                isMouseMoving = true;
            }
        }

        // Xử lý sự kiện khi chuột di chuyển trên canvas
        function onMouseMove(e) {
            if (isMouseMoving) {
                // Lấy tọa độ hiện tại của chuột và tính toán kích thước vùng cắt
                var currentX = e.clientX - canvas.getBoundingClientRect().left;
                var currentY = e.clientY - canvas.getBoundingClientRect().top;
                cropRect.width = currentX - cropRect.x;
                cropRect.height = currentY - cropRect.y;

                // Xóa nội dung của canvas để vẽ lại
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Vẽ lại ảnh gốc từ biến tạm lên canvas
                context.drawImage(tempImg, 0, 0);

                // Vẽ đường viền đỏ xung quanh vùng cắt
                context.strokeStyle = 'red';
                context.lineWidth = 2;
                context.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
            }
        }

// Xử lý sự kiện khi chuột được nhảy lên từ canvas
        function onMouseUp(e) {
            if (cropRectVisible) {
                // Lấy tọa độ hiện tại của chuột và tính toán kích thước vùng cắt
                var currentX = e.clientX - canvas.getBoundingClientRect().left;
                var currentY = e.clientY - canvas.getBoundingClientRect().top;
                cropRect.width = currentX - cropRect.x;
                cropRect.height = currentY - cropRect.y;

                // Xóa nội dung của canvas để vẽ lại
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Vẽ lại ảnh gốc từ biến tạm lên canvas
                context.drawImage(tempImg, 0, 0);

                // Tính toán tọa độ mới của vùng cắt dựa trên tâm của vùng cắt ban đầu
                var centerX = cropRect.x + cropRect.width / 2;
                var centerY = cropRect.y + cropRect.height / 2;
                cropRect.x = centerX - cropRect.width / 2;
                cropRect.y = centerY - cropRect.height / 2;

                // Vẽ đường viền đỏ xung quanh vùng cắt
                context.strokeStyle = 'red';
                context.lineWidth = 2;
                context.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);

                // Cắt ảnh theo vùng cắt được chọn
                if (cropRect.width > 0 && cropRect.height > 0) {
                    // Tạo canvas mới để chứa ảnh đã cắt
                    var croppedCanvas = document.createElement('canvas');
                    var croppedContext = croppedCanvas.getContext('2d');
                    croppedCanvas.width = cropRect.width;
                    croppedCanvas.height = cropRect.height;
                    croppedContext.drawImage(tempImg, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);

                    // Xóa nội dung của canvas
                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Cập nhật lại kích thước của canvas
                    canvas.width = cropRect.width;
                    canvas.height = cropRect.height;

                    // Vẽ ảnh đã cắt lên canvas
                    context.drawImage(croppedCanvas, 0, 0);

                    // Kết thúc quá trình cắt ảnh
                    canvas.removeEventListener('mousedown', onMouseDown);
                    isCropping = false;

                    // Ẩn con trỏ chuột
                    canvas.style.cursor = "default";

                    // Lưu lại dữ liệu ảnh đã cắt vào lịch sử chỉnh sửa (edit history)
                    editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
                }

                // Xóa các sự kiện mousemove và mouseup
                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('mouseup', onMouseUp);

                // Đánh dấu vùng cắt không còn hiển thị và chuột không di chuyển nữa
                cropRectVisible = false;
                isMouseMoving = false;
            }
        }

    }

    // Vẽ
    {
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
    }


    // Viết chữ
    {
        var textElements = [];
        var selectedTextIndex = -1;
        var isDragging = false;
        var isResizing = false;
        var resizeIndex = -1;
        var prevX;
        var prevY;
        var textScale = 1;
        var prevImgData;

        function drawTextElements() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(prevImgData, 0, 0);

            textElements.forEach(function (textElement, index) {
                context.font = textElement.fontSize * textScale + 'px Arial';
                context.fillStyle = textElement.color;
                context.fillText(textElement.text, textElement.x, textElement.y);

                if (index === selectedTextIndex) {
                    context.strokeStyle = 'red';
                    context.lineWidth = 2;
                    context.strokeRect(
                        textElement.x,
                        textElement.y - textElement.fontSize * textScale,
                        context.measureText(textElement.text).width,
                        textElement.fontSize * textScale
                    );
                }
            });
        }

        function addText() {
            var text = document.getElementById('text').value;
            var textColor = document.getElementById('textColor').value;
            var fontSize = parseInt(document.getElementById('fontSize').value);

            var textElement = {
                text: text,
                color: textColor,
                fontSize: fontSize,
                x: canvas.width / 2,
                y: canvas.height / 2
            };

            textElements.push(textElement);
            drawTextElements();
            if (text != '')
                editHis.push(context.getImageData(0, 0, canvas.width, canvas.height));
        }

        function deleteText() {
            if (selectedTextIndex !== -1) {
                textElements.splice(selectedTextIndex, 1);
                selectedTextIndex = -1;
                drawTextElements();
            }
        }

        function updateTextScale() {
            textScale = parseFloat(document.getElementById('fontSize').value) / 20;
            drawTextElements();
        }

        function clearSelection() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.putImageData(prevImgData, 0, 0);
            drawTextElements();
        }

        function handleText() {
            prevImgData = context.getImageData(0, 0, canvas.width, canvas.height);
            addText();

            canvas.addEventListener('mousedown', function (e) {
                var x = e.offsetX;
                var y = e.offsetY;

                isDragging = false;
                isResizing = false;
                resizeIndex = -1;

                isInsideText = false; // Reset trạng thái

                // Kiểm tra xem chuột có nằm trong vùng chữ không
                textElements.forEach(function (textElement, index) {
                    var textWidth = context.measureText(textElement.text).width;
                    var textHeight = textElement.fontSize * textScale;
                    if (
                        x >= textElement.x &&
                        x <= textElement.x + textWidth &&
                        y >= textElement.y - textHeight &&
                        y <= textElement.y
                    ) {
                        selectedTextIndex = index;
                        isDragging = true;
                        startX = x;
                        startY = y;
                        isInsideText = true;
                    }
                });

                if (!isInsideText) {
                    selectedTextIndex = -1;
                    clearSelection();
                }

                drawTextElements();
            });

            canvas.addEventListener('mousemove', function (e) {
                var x = e.offsetX;
                var y = e.offsetY;

                if (isDragging) {
                    var deltaX = x - startX;
                    var deltaY = y - startY;

                    // Kiểm tra nếu văn bản đã di chuyển đi
                    if (deltaX !== 0 || deltaY !== 0) {
                        // Xóa chữ tại vị trí ban đầu
                        context.clearRect(
                            textElements[selectedTextIndex].x,
                            textElements[selectedTextIndex].y - textElements[selectedTextIndex].fontSize * textScale,
                            context.measureText(textElements[selectedTextIndex].text).width,
                            textElements[selectedTextIndex].fontSize * textScale
                        );
                    }

                    textElements[selectedTextIndex].x += deltaX;
                    textElements[selectedTextIndex].y += deltaY;

                    startX = x;
                    startY = y;

                    clearSelection();
                    drawTextElements();
                }
            });



            canvas.addEventListener('mouseup', function () {
                isDragging = false;
            });

            canvas.addEventListener('mouseleave', function () {
                isDragging = false;
            });
        }
    }
    // Đối xứng
    function FlipImage() {
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
        FlipImage();
    });
}
