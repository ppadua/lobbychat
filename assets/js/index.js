$(document).ready(function(){
    var socket = io.connect();

    $("body").on("click", "#show_create_room_modal", function(){
        $("#create_room_modal").removeClass("hidden");
    });

    $("body").on("click", ".cancel_room", function(){
        $(this).closest(".modal").addClass("hidden");
    });

    $("body").on("click", ".create_new_user", function(){
    	if($("#new_user_name").val().trim() != ""){
	        socket.emit("new_user", { name : $("#new_user_name").val() });

	        $("#create_new_user").remove();
	        $("#dashboard").removeClass("hidden");
	        $(".loading").removeClass("hidden");
    	}
    	else
    		$("#new_user_name").addClass("error_input");
    });

    $("body").on("click", ".enter_room", function(){
    	$(".loading").removeClass("hidden");
    	socket.emit("user_enter_room", $(this).closest("tr").attr("data-id"));
    });

    $("body").on("submit", "#chat_room_submit", function(){
    	var form = $(this);

    	form.find("button").attr("disabled", "disabled");
    	form.find("button").children(".chat_submit_button").removeClass("hidden");

    	socket.emit("user_message", form.find("#chat_value").val());
    	form[0].reset();

    	return false;
    })

    $("body").on("click", "#leave_button", function(){
        $("#leave_room").removeClass("hidden");
    })

    $("body").on("click", "#leave_room .create_room", function(){
    	$(".loading").removeClass("hidden");
    	socket.emit("leave_room");
        $("#leave_room").addClass("hidden");
    });

    socket.on("welcome_new_user", function(data){
    	var user_list = "";

    	for (var i = 0; i < data.length; i++) {
    		user_list += "<li data-user-id='"+data[i].id+"'>"+data[i].name+"</li>";
    	}

    	$("#user_list ul").empty().append(user_list);
    });

    socket.on("user_create_room", function(data){
    	$("body").on("click", "#create_room_modal .create_room", function(){
    	 	if($("#room_name").val().trim() != ""){
	      		$(".loading").removeClass("hidden");

		        socket.emit("new_room", {
		            room_name : $("#room_name").val(),
		            room_password : $("#room_password").val(),
		            roomlist : [{ id : data.id, name : data.name }]
		        });


	    	    $("#create_room_modal").addClass("hidden");
    	 		$("#room_name").removeClass("error_input")
    	 		$("#create_room_modal form")[0].reset();
    	 	}
    	 	else
    	 		$("#room_name").addClass("error_input");
	    });
    });

    socket.on("all_room", function(data){
    	for (var i = 0; i < data.length; i++) {
            $("#dashboard #room_list tbody").append("<tr data-id="+data[i].room_id+"> \
				<td><a href='#' class='enter_room'>"+data[i].room_name+"</a></td> \
				<td class='room_count'>"+data[i].roomlist.length+"</td> \
				<td>"+(data[i].room_password == "" ? "" : '<i class="fa fa-lock" aria-hidden="true"></i>')+"</td> \
			</tr>");  
        }

        $(".loading").addClass("hidden");
    });

    socket.on("enter_room_password", function(room){
    	$("#enter_password").removeClass("hidden");
		$(".loading").addClass("hidden");


    	$("body").on("click", "#enter_password .create_room", function(){
			$(".loading").removeClass("hidden");

    		if($("#enter_password_submit #password").val() == room.room_password){
    			socket.emit("success_enter_room", room.room_id);
    			$("#enter_password").addClass("hidden");
    		}
    		else{
    			$(".loading").addClass("hidden");
    			$(".error_message").remove();
    			$("#enter_password_submit").before("<p class='error_message'>You've entered an incorrect password</p>");
    		}
    	});
    });

    socket.on("show_room", function(data){
    	$("#room_list table tbody").append("<tr data-id="+data.room_id+"> \
			<td data-id="+data.id+"><a href='#' class='enter_room'>"+data.room_name+"</a></td> \
			<td class='room_count'>"+data.roomlist.length+"</td> \
			<td>"+(data.room_password == "" ? "" : '<i class="fa fa-lock" aria-hidden="true"></i>')+"</td> \
		</tr>");
    });

    socket.on("update_chat_room", function(data, message, is_create, room_id){
    	var user_name = (is_create ? data.roomlist[0].name : data.name)
    	var user_id = (is_create ? data.roomlist[0].id : data.id)

		$("#room").find(".rooms[data-room-id='"+room_id+"']").find("#user_chats").append('<section class="new_joined_user"><p>'+user_name+''+message+'</p></section>');
		$("#room").find(".rooms[data-room-id='"+room_id+"']").find("#class_room_user_list ul").append("<li data-user-id='"+user_id+"'>"+user_name+"</li>");
		$(".loading").addClass("hidden");
    });

    socket.on("update_chat_user_list", function(data){
		var class_room_user_list = "";

    	for (var i = 0; i < data.roomlist.length; i++) {
    		class_room_user_list += "<li data-user-id='"+data.roomlist[i].id+"'>"+data.roomlist[i].name+"</li>";
    	}
    	
    	$("#room").find(".rooms[data-room-id='"+data.room_id+"']").find("#class_room_user_list ul").empty().append(class_room_user_list);
    });

    socket.on("enter_chat_room", function(data){
		$(".loading").addClass("hidden");
		$("#dashboard").addClass("hidden");
		$("#room #user_chats").empty("hidden");

        $("#room").append('<div class="rooms" data-room-id="'+data.room_id+'"> \
            <div id="class_room"> \
                <div id="user_chats"></div> \
                <div id="form_chat"> \
                    <form action="" id="chat_room_submit"> \
                        <input type="text" id="chat_value"> \
                        <button class="buttonload"> \
                            <i class="fa fa-spinner fa-spin chat_submit_button hidden"></i> \
                            <span>Submit</span> \
                        </button> \
                    </form> \
                </div> \
            </div> \
            <div id="class_room_user_list"> \
                <h2>Chat Room Users</h2> \
                <ul></ul> \
                <div class="leave"> \
                    <button id="leave_button">Leave</button> \
                </div> \
            </div> \
        </div>');
    });

    socket.on("update_room_count", function(data){
    	if(data.roomlist.length == 0){
    		$("#room_list table tbody tr[data-id='"+data.room_id+"']").remove();
    	}
    	else{
    		$("#room_list table tbody tr[data-id='"+data.room_id+"']").find(".room_count").html(data.roomlist.length);
    	}
    });

    socket.on("disconnected_chat_room", function(data, message, room){
		$("#room").find(".rooms[data-room-id='"+room.room_id+"']").find("#user_chats").append('<section class="leave_user"><p>'+data.name+''+message+'</p></section>');
		$("#room").find(".rooms[data-room-id='"+room.room_id+"']").find("#class_room_user_list ul li[data-user-id='"+data.id+"']").remove();
    });

    socket.on("leave_chat_room", function(room_id){
		$(".loading").addClass("hidden");
		$("#room").find(".rooms[data-room-id='"+room_id+"']").remove();
		$("#leave_room").addClass("hidden");
		$("#dashboard").removeClass("hidden");
    });

    socket.on("show_message", function(name, message, room_id){
    	$("#room").find(".rooms[data-room-id='"+room_id+"']").find("#user_chats").append(' <section class="new_user_chat"> \
	        <div class="user_icon"> \
	            <i class="fa fa-user-o" aria-hidden="true"></i> \
	        </div> \
	        <div class="user_chat"> \
	            <p class="class_room_user_name">'+name+'</p> \
	            <p class="class_room_user_chat">'+message+'</p> \
	        </div> \
	    </section>');

    	// getMessages();
    	$("#room").find(".rooms[data-room-id='"+room_id+"']").find("#chat_room_submit").find("button").removeAttr("disabled");
    	$("#room").find(".rooms[data-room-id='"+room_id+"']").find("#chat_room_submit").find("button").children(".chat_submit_button").addClass("hidden");
    });
  
    socket.on("remove_chat_room", function(data){
    	$("#room_list table tbody tr[data-id='"+data.room_id+"']").remove();
    });

    socket.on("disconnected_user", function(data){
    	$("#user_list ul li[data-user-id='"+data+"']").remove();
    });

    const messages = document.getElementById('user_chats');

	function getMessages() {
	  shouldScroll =  messages.scrollTop +  messages.clientHeight === messages.scrollHeight;
	  if (!shouldScroll) {
	    scrollToBottom();
	  }
	}

	function scrollToBottom() {
		messages.scrollTop = messages.scrollHeight;
	}
})