/* 
 * @Author: 周磊
 * @Date:   2017-4-13 14:04:38
 * @Last Modified by:   zhoulei
 * @Last Modified time: 2017-4-13 14:04:38
 */
var map = new BMap.Map("allmap"); // 创建Map实例 全局变量
var CARID_FOR_SEARCHTEXT; // 全局变量 ,(此值仅用于搜索框的ajax刷新
// 用)。初次赋值为通过搜索输入框输入的数据。保存搜索框的值
var CAR_PREMARKER_ARRY = []; // 全局变量 ,(此值仅用于多辆车ajax刷新用)。保存车牌号和上次车辆地理位置 Marker
var ONE_CAR_PREMARKER = {
	"carId" : "",
	"preMarker" : ""
}; // 全局变量 ,(此值仅用一辆车的ajax刷新用)。保存一辆车的车牌号和上次地理位置 Marker
var test = 0;
var moveIcon = new BMap.Icon("/Gisv2/images/motorcycle.ico", new BMap.Size(52, 26), {
	imageOffset : new BMap.Size(0, 0)
});
var lushu;
var isOpen = 0;
// 全局变量，判断是否已经打开弹出框
jQuery.noConflict();
/**
 * 初始化地图 默认定位中心，大连市
 */
function initialize() {
	map.centerAndZoom(new BMap.Point(121.62, 38.92), 12); // 初始化地图，设置中心点坐标和地图级别
	map.addControl(new BMap.MapTypeControl()); // 添加地图类型控件
	map.addControl(new BMap.OverviewMapControl()); // 添加缩略地图控件
	map.addControl(new BMap.NavigationControl()); // 添加地图缩放控件
	var top_left_control = new BMap.ScaleControl({
		anchor : BMAP_ANCHOR_TOP_LEFT
	});// 左上角，添加比例尺
	map.addControl(top_left_control);
	map.setCurrentCity("大连"); // 设置地图显示的城市，这项是必须的
	map.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放
}

/**
 * 复选框控制js
 */
function checkBoxControl() {
	// 全选
	var arr_carid = new Array();
	jQuery('#chk_all_track').bind("click", function selectAll() {
		clearSearchText();
		if (jQuery("#chk_all_track").prop("checked")) {
			jQuery('input[name="chkItem"]').prop("checked", true);
			var s1 = jQuery("input[name='chkItem']");
			s1.each(function(i) {
				if (this.checked == true) {
					arr_carid.push(this.value);
					arr_carid.join(',');
					// postByCarId(this.value);
				}
			});
			postByArryCarId(arr_carid);
		} else {
			jQuery('input[name="chkItem"]').prop('checked', false);
			arr_carid = [];
			CAR_PREMARKER_ARRY = [];
			clearMap();
		}
	})

	// 任意选择一辆车
	jQuery(function() {
		var s3 = jQuery("input[name='chkItem']");
		s3.each(function(i) {
			jQuery(this).on('change', function() {
				if (this.checked == true) {
					arr_carid.push(this.value);
					arr_carid.join(',');
				} else {
					removeCarIdFromArry(arr_carid, this.value);
					removePreMarkerByCarId(CAR_PREMARKER_ARRY, this.value);
				}
				clearSearchText();
				if (arr_carid.length > 0) {
					postByArryCarId(arr_carid);
				} else {
					clearMap();
				}
			});
		});
	})
}

/**
 * 输入车牌号搜索实时位置信息
 */
function searchControl() {
	jQuery('#track-search-btn').bind("click", function() {
		clearCheakBox();
		clearMapById(CARID_FOR_SEARCHTEXT);
		CARID_FOR_SEARCHTEXT = jQuery("input[name='searchtext_carid']").val().trim();
		// 正式生产启用,规范车牌号输入，必须为标准车牌号7位
		// if (carid != null && "" != carid && carid.length == 7) {
		if (CARID_FOR_SEARCHTEXT == null || "" == CARID_FOR_SEARCHTEXT) {
			alert("车牌号不能为空！");
			clearSearchText();
			clearMap();
		} else if (CARID_FOR_SEARCHTEXT != null && "" != CARID_FOR_SEARCHTEXT) {
			postByCarId(CARID_FOR_SEARCHTEXT);
		} else {
			alert("车牌号输入错误！");
			clearSearchText();
			clearMap();
		}
	})
}

/**
 * 根据车牌号刷新地图
 */
function flushMapByCarId() {
	if (CARID_FOR_SEARCHTEXT != null && "" != CARID_FOR_SEARCHTEXT) {
		postByCarId(CARID_FOR_SEARCHTEXT);
	} else {
		if (ONE_CAR_PREMARKER.carId != null && "" != ONE_CAR_PREMARKER.carId) {
			postByCarId(ONE_CAR_PREMARKER.carId);
		}

	}
}

/**
 * 刷新一组车牌号的地图
 */
function flushMapByCarArry() {
	if (CAR_PREMARKER_ARRY != null && CAR_PREMARKER_ARRY.length > 0) {
		var carIdArry = [];
		for (var i = 0; i < CAR_PREMARKER_ARRY.length; i++) {
			carIdArry.push(CAR_PREMARKER_ARRY[i].carId);
		}
		postByArryCarId(carIdArry);
	}
}

/**
 * @param longitude
 * @param latitude
 *            定位，并绘制地图
 */
function locationByCarArry(carArry) {
	// alert(carId + "定位中");
	clearMapByCarArry(carArry);
	var carPreMarkerArry = [];
	var points = [];
	var new_point;
	for (var i = 0; i < carArry.length; i++) {
		var carId = carArry[i].carId;
		var longitude = carArry[i].x;
		var latitude = carArry[i].y;
		var time = carArry[i].time;
		var address = carArry[i].address;
		var speed = carArry[i].speed;
        var cameraId1 = carArry[i].cameraId1;
        var cameraId2 = carArry[i].cameraId2;
        new_point = new BMap.Point(longitude, latitude);
		points.push(new_point);
		points.join(',');
		// coordinateArr.push(new_point);
		var myIcon = new BMap.Icon("/Gisv2/images/motorcycle.ico", new BMap.Size(52, 26), {
			imageOffset : new BMap.Size(0, 0)
		});
		var marker = new BMap.Marker(new_point, {
			icon : myIcon
		});

		(function(x) {
			var opts = {
				width : 300, // 信息窗口宽度
				height : 200, // 信息窗口高度
				title : "车辆信息", // 信息窗口标题
				enableMessage : true,// 设置允许信息窗发送短息
			}
			var content = "<table>";
			content = content + "<tr><td> 牌照：" + carId + "</td></tr>";
			content = content + "<tr><td> 定位：" + longitude + "," + latitude + "</td></tr>";
			content = content + "<tr><td> 时间：" + time + "</td></tr>";
			content = content + "<tr><td> 地址：" + address + "</td></tr>";
			content = content + "<tr><td> 速度：" + speed + " km/h" + "</td></tr>";
			content = content + "<tr><td> <a id=\"btnDel\" class=\"btnDel\" href=\"/Gisv2/RealTimeVideoByCameraId.html?cameraId=" + cameraId1 + "\">实时视频监控</a>" + "</td></tr>";
			content += "</table>";
			var infoWindow = new BMap.InfoWindow(content, opts); // 创建信息窗口对象
			marker.addEventListener("click", function() {
				this.openInfoWindow(infoWindow, new_point); // 开启信息窗口
			}); // 在图标实例上添加鼠标点击事件
		})(i);
		map.addOverlay(marker);
		var carMarker1 = {
			"carId" : carId,
			"preMarker" : marker
		};
		carPreMarkerArry.push(carMarker1);
	}
	if (carArry.length == 1) {
		map.panTo(new_point);// 移动地图中心
	}
	CAR_PREMARKER_ARRY = carPreMarkerArry;
	carPreMarkerArry = [];
}

/**
 * @param longitude
 * @param latitude
 *            定位，并绘制地图
 */
function locationByCarId(car) {
	if (car != null) {
		clearMap();
		var new_point = new BMap.Point(car.x, car.y);
		var myIcon = new BMap.Icon("/Gisv2/images/motorcycle.ico", new BMap.Size(52, 26), {
			imageOffset : new BMap.Size(0, 0)
		});
		var marker = new BMap.Marker(new_point, {
			icon : myIcon
		});
		var opts = {
			width : 340, // 信息窗口宽度
			height : 160, // 信息窗口高度
			title : "车辆信息", // 信息窗口标题
			enableMessage : true,// 设置允许信息窗发送短息
		}
		var content = "<table>";
		content = content + "<tr><td> 牌照：" + car.carId + "</td></tr>";
		content = content + "<tr><td> 定位：" + car.x + "," + car.y + "</td></tr>";
		content = content + "<tr><td> 时间：" + car.time + "</td></tr>";
		content = content + "<tr><td> 地址：" + car.address + "</td></tr>";
		content += "</table>";
		// console.log(car.address);
		var infoWindow = new BMap.InfoWindow(content, opts); // 创建信息窗口对象
		marker.addEventListener("click", function() {
			map.openInfoWindow(infoWindow, new_point); // 开启信息窗口
		});
		map.addOverlay(marker);
		if ("" != CARID_FOR_SEARCHTEXT || "" != ONE_CAR_PREMARKER.carId) {
			map.panTo(new_point);// 移动地图中心
		}
		var carMarker1 = {
			"carId" : car.carId,
			"preMarker" : marker
		};
		ONE_CAR_PREMARKER = carMarker1;
	}
	console.log(ONE_CAR_PREMARKER);
}

/**
 * 清理搜索输入框文本，并且制空全局变量中保存的输入框输入的车牌号
 */
function clearSearchText() {
	jQuery("#track-search-text").val(""); // 制空输入框
	CARID_FOR_SEARCHTEXT = "";
	ONE_CAR_PREMARKER = {};
}

/**
 * 清理复选框
 */
function clearCheakBox() {
	jQuery('input[name="chkItem"]').prop('checked', false);
	jQuery("#chk_all_track").prop("checked", false);
	CAR_PREMARKER_ARRY = {};
}

/**
 * 清理地图图层
 */
function clearMap() {
	map.clearOverlays();
}

/**
 * 褰撳湪澶嶉�妗嗕腑鍘婚櫎涓�締杞︽椂锛岄�杩嘽arId灏咰AR_PREMARKER_ARRY涓繖杈嗚溅淇℃伅娓呯悊锛岀劧鍚庢竻鐞嗗湴鍥惧浘灞�
 * 
 * function clearMapByIdFromArry(carid) { if ("" != carid && carid != null) { if
 * ("" != ONE_CAR_PREMARKER.carId && ONE_CAR_PREMARKER.carId != null) { if
 * (ONE_CAR_PREMARKER.carId == carid) {
 * map.removeOverlay(ONE_CAR_PREMARKER.preMarker); } } else { if
 * (CARID_FOR_SEARCHTEXT != "" && carid == CARID_FOR_SEARCHTEXT) { clearMap(); } } } } /
 * /** 通过carId清理地图图层
 */
function clearMapById(carid) {
	if ("" != carid && carid != null) {
		if ("" != ONE_CAR_PREMARKER.carId && ONE_CAR_PREMARKER.carId != null) {
			if (ONE_CAR_PREMARKER.carId == carid) {
				map.removeOverlay(ONE_CAR_PREMARKER.preMarker);
			}
		} else {
			if (CARID_FOR_SEARCHTEXT != "" && carid == CARID_FOR_SEARCHTEXT) {
				clearMap();
			}
		}
	}
}

/**
 * 通过car数组清理地图图层
 */
function clearMapByCarArry(carArry) {
	if (carArry != null && carArry.length > 0) {
		clearMap();
	}
	console.log(CAR_PREMARKER_ARRY);
}

/**
 * @param caridArry
 *            通过车牌号数组，查询一组车辆最后地理位置信息 如果无法查询到相关信息，提示用户并清理全局变量和地图
 */
function postByArryCarId(carIdArry) {
	var req = createXMLHTTPRequest();
	if (req) {
		req.open("POST", "/Gisv2/CarAction!getLastInfoByArryCarId?carId=" + carIdArry, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8;");
		req.send("");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (req.status == 200) {
					// var str = req.responseText.split(",");
					if (req.responseText != null) {
						var objArr = JSON.parse(req.responseText);
						locationByCarArry(objArr);
					}
				}
			}
		}
	}

}

/**
 * @param carid
 *            通过车牌号查询车辆最后地理位置信息 如果无法查询到相关信息，提示用户并清理全局变量和地图
 */
function postByCarId(carId) {
	var req = createXMLHTTPRequest();
	if (carId != null && carId != null) {
		if (req) {
			req.open("POST", "/Gisv2/CarAction!getLastInfoByCarId?carId=" + carId, true);
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=GBK;");
			req.send("");
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200) {
						if (req.responseText != null && "" != req.responseText) {
							var obj = JSON.parse(req.responseText);
							if (obj != null) {
								locationByCarId(obj);
							}
						} else {
							// 如果此次查询车辆信息不存在
							clearSearchText();
							clearMap(); // 清空地图
							alert("暂无该车辆信息！");
						}
					}
				}
			}
		}
	}
}

/**
 * ajax 共用方法
 * 
 * @returns {___anonymous2299_2312}
 */
function createXMLHTTPRequest() {
	// 1.创建XMLHttpRequest对象
	// 这是XMLHttpReuquest对象无部使用中最复杂的一步
	// 需要针对IE和其他类型的浏览器建立这个对象的不同方式写不同的代码
	var xmlHttpRequest;
	if (window.XMLHttpRequest) {
		// 针对FireFox，Mozillar，Opera，Safari，IE7，IE8
		xmlHttpRequest = new XMLHttpRequest();
		// 针对某些特定版本的mozillar浏览器的BUG进行修正
		if (xmlHttpRequest.overrideMimeType) {
			xmlHttpRequest.overrideMimeType("text/xml");
		}
	} else if (window.ActiveXObject) {
		// 针对IE6，IE5.5，IE5
		// 两个可以用于创建XMLHTTPRequest对象的控件名称，保存在一个js的数组中
		// 排在前面的版本较新
		var activexName = [ "MSXML2.XMLHTTP", "Microsoft.XMLHTTP" ];
		for (var i = 0; i < activexName.length; i++) {
			try {
				// 取出一个控件名进行创建，如果创建成功就终止循环
				// 如果创建失败，回抛出异常，然后可以继续循环，继续尝试创建
				xmlHttpRequest = new ActiveXObject(activexName[i]);
				if (xmlHttpRequest) {
					break;
				}
			} catch (e) {
			}
		}
	}
	return xmlHttpRequest;
}

/**
 * @param arr
 * @param val
 *            鏍规嵁浼犲叆鐨勬煇涓�锛屽垹闄ゆ暟缁勪腑鎸囧畾鍏冪礌 涓昏鐢ㄤ簬鍏ㄥ眬鍙橀噺CAR_PREMARKER_ARRY
 *            涓垹闄よ溅杈嗕俊鎭�
 */
function removePreMarkerByCarId(arr, val) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].carId == val) {
			arr.splice(i, 1);
			break;
		}
	}
}

/**
 * @param arr
 * @param val
 *            鏍规嵁浼犲叆鐨勬煇涓�锛屽垹闄ゆ暟缁勪腑鎸囧畾鍏冪礌 涓昏鐢ㄤ簬浠呮湁杞︾墝鍙风殑鏁扮粍鍙橀噺鍒犻櫎杞︾墝鍙�
 */
function removeCarIdFromArry(arr, val) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == val) {
			arr.splice(i, 1);
			break;
		}
	}
}
/**
 * 椤甸潰鍥炬爣go鐨勬柟娉�
 */
function goPage() {
	var nowPage = document.getElementById("nowPage").value;
	var totalPage = document.getElementById("totalPage").value;
	var username = document.getElementById("username").value;
	if (nowPage > totalPage) {
		alert("输入页码过大！总计" + totalPage + "页");
	} else {
		window.location.href = "/Gisv2/SearchCarAction!getCarList?username=" + username + "&pageNum=" + nowPage;
	}
}

function drawTrackByCarArry(carArry) {
	var points = [];
	for (var i = 0; i < carArry.length; i++) {
		// var carId = carArry[i].carId;
		var longitude = carArry[i].x;
		var latitude = carArry[i].y;
		var point = new BMap.Point(longitude, latitude);
		points.push(point);
		points.join(',');
	}

	var n = points.length - 1;
	var myP1 = points[0];
	var myP2 = points[n];
	var myIcon1 = new BMap.Icon("/Gisv2/images/start.png", new BMap.Size(32, 70), {
		imageOffset : new BMap.Size(0, 0)
	});
	var myIcon2 = new BMap.Icon("/Gisv2/images/end.png", new BMap.Size(32, 70));
	var centerPoint = new BMap.Point((points[0].lng + points[points.length - 1].lng) / 2, (points[0].lat + points[points.length - 1].lat) / 2);
	map.panTo(centerPoint);
	map.addOverlay(new BMap.Polyline(points, {
		strokeColor : "blue",
		strokeWeight : 3,
		strokeOpacity : 1
	}));
	label = new BMap.Label("", {
		offset : new BMap.Size(-20, -20)
	});
	var myP1Marker = new BMap.Marker(myP1, {
		icon : myIcon1
	});
	myP1Marker.setAnimation(BMAP_ANIMATION_BOUNCE); // 跳动的动画
	var myP2Marker = new BMap.Marker(myP2, {
		icon : myIcon2
	});
	myP2Marker.setAnimation(BMAP_ANIMATION_BOUNCE); // 跳动的动画
	map.addOverlay(myP1Marker);
	map.addOverlay(myP2Marker);
}
/**
 * 通过车牌号查询车辆历史轨迹
 */
function queryHistoryTrackByCarId() {
	var carId = document.getElementById("searchinput").value.trim();
	var start = document.getElementById("start").value.trim();
	var end = document.getElementById("end").value.trim();
	var b_value = new Date(document.getElementById("start").value.replace(/-/g, '/')).getTime(), e_value = new Date(document.getElementById("end").value.replace(/-/g, '/')).getTime();

	if (carId == "") {
		alert("车牌号不能为空！");
		return false;
	}

	if (start == "" || end == "") {
		alert("起始日期或结束日期不能为空");
		return false;
	}
	if (!check_time('start', 'end')) {
		alert("开始时间不能大于结束时间!");
		return false;
	}

	if (!check_time_diff(b_value, e_value, 31 * 24 * 60 * 60 * 1000)) {
		alert("时间跨度不能大于{0}天！".replace("{0}", 31));
		return false;
	} else {
		clearSearchText();
		clearCheakBox();
		clearMap();
		var req = createXMLHTTPRequest();
		if (req) {
			req.open("POST", "/Gisv2/CarAction!lonlatlist?start=" + start + "&end=" + end + "&carId=" + carId, true);
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8;");
			req.send("");
			req.onreadystatechange = function() {
				if (req.readyState == 4) {
					if (req.status == 200) {
						if (req.responseText != null && req.responseText.length > 2) {
							var objArr = JSON.parse(req.responseText);
							// drawTrackByCarArry(objArr);
							lushuMove(objArr);
						} else {
							alert("暂无该车辆轨迹信息!");
						}
					}
				}
			}
		}
	}
}

/**
 * @param carArry
 *            通过百度地图路书功能实现轨迹查询与回放 目前来看最准的了
 */
function lushuMove(carArry) {
	var points = [];
	for (var i = 0; i < carArry.length; i++) {
		// var carId = carArry[i].carId;
		var longitude = carArry[i].x;
		var latitude = carArry[i].y;
		var point = new BMap.Point(longitude, latitude);
		points.push(point);
		points.join(',');
	}
	var carId = carArry[0].carId;
	var sum = 0;

	var group = Math.floor(points.length / 11);
	var mode = points.length % 11;
	// console.log(points);
	// console.log("group=" + group, "mode=" + mode, "length=" + points.length);
	var drv = new BMap.DrivingRoute(map, {
		onSearchComplete : function(res) {
			if (drv.getStatus() == BMAP_STATUS_SUCCESS) {
				var dis = res.getPlan(0).getRoute(0).getDistance(false);
				sum += dis;
				// console.log("sum=" + sum, "res值" +
				// res.getPlan(0).getRoute(0).getDistance(false));
				map.addOverlay(new BMap.Polyline(points, {
					strokeColor : '#111'
				}));
				map.setViewport(points);
				lushu = new BMapLib.LuShu(map, points, {
					defaultContent : carId + "\n总路程为：" + sum / 1000 + " 公里",
					speed : 200,
					icon : moveIcon,
					autoView : true,// 是否开启自动视野调整，如果开启那么路书在运动过程中会根据视野自动调整
					enableRotation : true,// 是否设置marker随着道路的走向进行旋转
				});
			}
		}
	});

	for (var i = 0; i < group; i++) {
		var waypoints = points.slice(i * 11 + 1, (i + 1) * 11); // 注意这里的终点如果是11的倍数的时候，数组可是取不到最后一位的，所以要注意终点-1喔。

		// console.log(waypoints);
		var pstart = points[i * 11];
		var pend = points[(i + 1) * 11];
		// console.log(pstart, pend);
		drv.search(pstart, pend, {
			waypoints : waypoints
		});
		// waypoints表示途经点
	}
	if (mode != 0) {
		var waypoints = points.slice(group * 11 + 1, points.length - 1);// 多出的一段单独进行search
		// console.log("--------------------------------");
		// console.log(waypoints);
		var pstart = points[group * 11];
		var pend = points[points.length - 1];
		// console.log(pstart, pend);
		drv.search(pstart, pend, {
			waypoints : waypoints
		});
	}
}

/**
 * 控制轨迹查询后轨迹回访按钮是否出现
 */
function hideAndshowControl() {
	jQuery("#guijiQuery").click(function() {
		jQuery("#buttonBox").show();
	});

	jQuery("#track-search-btn").click(function() {
		jQuery("#buttonBox").hide();
	});

	jQuery("#chk_all_track").click(function() {
		jQuery("#buttonBox").hide();
	});

	jQuery("#chk_item").click(function() {
		jQuery("#buttonBox").hide();
	});
}
// 绑定事件
$("run").onclick = function() {
	lushu.start();
}
$("stop").onclick = function() {
	lushu.stop();
}
$("pause").onclick = function() {
	lushu.pause();
}
$("hide").onclick = function() {
	lushu.hideInfoWindow();
}
$("show").onclick = function() {
	lushu.showInfoWindow();
}
function $(element) {
	return document.getElementById(element);
}

function initCheckAll() {
	document.getElementById("chk_all_track").click();
}

// 开始时间小于结束时间的检查
function check_time(id_a, id_b) {
	var b_value = document.getElementById(id_a).value, e_value = document.getElementById(id_b).value;
	return new Date(e_value.replace(/-/g, '/')).getTime() > new Date(b_value.replace(/-/g, '/')).getTime();
}

// 时间间隔检查
// @param begin,开始时间
// @param end,结束时间
// @param diff，时间间隔
// @return true，差小于diff时返回；反之false
function check_time_diff(begin, end, diff) {
	return (end - begin) > diff ? false : true;
}

function getRtmpAddress() {
	var req = createXMLHTTPRequest();
	if (req) {
		req.open("POST", "/Gisv2/CarAction!getLastInfoByCarId?carId=" + "辽B12345", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8;");
		req.send("");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				if (req.status == 200) {
					// var str = req.responseText.split(",");
					if (req.responseText != null) {
						var rtmpAddress = "rtmp://live.hkstv.hk.lxdns.com/live/hks";
						openVedio(rtmpAddress);
					}
				}
			}
		}
	}
}
// 初始化
function init() {
	initialize();// 初始化地图
	checkBoxControl();
	searchControl();
	hideAndshowControl();
	setInterval("flushMapByCarId()", 5000); // 单量车刷新间隔
	setInterval("flushMapByCarArry()", 5000); // 多辆车刷新间隔
	setTimeout('initCheckAll()', 1000); // 延迟1秒
}

// 视频窗口操作,此方法暂且不使用
jQuery(".btnDel").click(function() {
	// jQuery(".box-mask").css({"display":"block"});
	jQuery(".box-mask").fadeIn(500);
	center(jQuery(".box"));
	// 载入弹出窗口上的按钮事件
	checkEvent(jQuery(this).parent(), jQuery(".btnSure"), jQuery(".btnCancel"));
});

//rtmp,此方法暂且不使用
function openVedio(rtmpAddress) {
	if (rtmpAddress != null && rtmpAddress != "") {

		var flashvars = {
			f : rtmpAddress,
			c : 0
		};
		var video = [ 'http://localhost/live.m3u8' ];
		CKobject.embed('/Gisv2/script/ckplayer.swf', 'player1', 'ckplayer_a1', '600', '400', false, flashvars, video);

		jQuery(".box-mask").fadeIn(500);
		center(jQuery(".box"));
		// 载入弹出窗口上的按钮事件
		checkEvent(jQuery(this).parent(), jQuery(".btnSure"), jQuery(".btnCancel"));
	} else {
		alert("获取视频地址失败!");
	}
}
//rtmp 方式时,视频弹出框位置,此方法暂且不使用
function center(obj) {
	// obj这个参数是弹出框的整个对象
	var screenWidth = jQuery(window).width(), screenHeigth = jQuery(window).height();
	// 获取屏幕宽高
	var scollTop = jQuery(document).scrollTop();
	// 当前窗口距离页面顶部的距离
	var objLeft = (screenWidth - obj.width()) / 2;
	// /弹出框距离左侧距离
	var objTop = (screenHeigth - obj.height()) / 2 + scollTop;
	// /弹出框距离顶部的距离
	obj.css({
		left : objLeft + "px",
		top : objTop + "px"
	});
	obj.fadeIn(500);
	// 弹出框淡入
	isOpen = 1;
	// 弹出框打开后这个变量置1 说明弹出框是打开装填
	// 当窗口大小发生改变时
	jQuery(window).resize(function() {
		// 只有isOpen状态下才执行
		if (isOpen == 1) {
			// 重新获取数据
			screenWidth = jQuery(window).width();
			screenHeigth = jQuery(window).height();
			var scollTop = jQuery(document).scrollTop();
			objLeft = (screenWidth - obj.width()) / 2;
			var objTop = (screenHeigth - obj.height()) / 2 + scollTop;
			obj.css({
				left : objLeft + "px",
				top : objTop + "px"
			});
			obj.fadeIn(500);
		}
	});
	// 当滚动条发生改变的时候
	jQuery(window).scroll(function() {
		if (isOpen == 1) {
			// 重新获取数据
			screenWidth = jQuery(window).width();
			screenHeigth = jQuery(window).height();
			var scollTop = jQuery(document).scrollTop();
			objLeft = (screenWidth - obj.width()) / 2;
			var objTop = (screenHeigth - obj.height()) / 2 + scollTop;
			obj.css({
				left : objLeft + "px",
				top : objTop + "px"
			});
			obj.fadeIn(500);
		}
	});
}
// 导入两个按钮事件 obj整个页面的内容对象，obj1为确认按钮，obj2为取消按钮
function checkEvent(obj, obj1, obj2) {
	// 确认后删除页面所有东西
	obj1.click(function() {
		// 移除所有父标签内容
		obj.remove();
		// 调用closed关闭弹出框
		closed(jQuery(".box-mask"), jQuery(".box"));
	});
	// 取消按钮事件
	obj2.click(function() {
		// 调用closed关闭弹出框
		closed(jQuery(".box-mask"), jQuery(".box"));
	});
}
// 关闭弹出窗口事件
function closed(obj1, obj2) {
	obj1.fadeOut(500);
	obj2.fadeOut(500);
	isOpen = 0;
}
