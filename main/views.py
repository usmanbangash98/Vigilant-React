
from django.core.files.storage import FileSystemStorage
from django.shortcuts import render, HttpResponse, redirect
from django.contrib import messages
import bcrypt
import face_recognition
from PIL import Image, ImageDraw
import numpy as np
import cv2
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import FileSerializer
from django.contrib.auth import logout


from main.models import User, Person, ThiefLocation


class FileView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_serializer = FileSerializer(data=request.data)
        if file_serializer.is_valid():
            file_serializer.save()
            return Response(file_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def index(request):
    return render(request, "session/login.html")


def addUser(request):
    return render(request, "home/add_user.html")


def addCitizen(request):
    return render(request, "home/add_citizen.html")


def logout_view(request):
    logout(request)
    messages.add_message(request, messages.INFO, "Successfully logged out")
    return redirect(index)


def viewUsers(request):
    users = User.objects.all()
    context = {"users": users}
    return render(request, "home/view_users.html", context)


def saveUser(request):
    errors = User.objects.validator(request.POST)
    if len(errors):
        for tag, error in errors.iteritems():
            messages.error(request, error, extra_tags=tag)
        return redirect(addUser)

    hashed_password = bcrypt.hashpw(request.POST["password"].encode(), bcrypt.gensalt())
    user = User.objects.create(
        first_name=request.POST["first_name"],
        last_name=request.POST["last_name"],
        email=request.POST["email"],
        password=hashed_password,
    )
    user.save()
    messages.add_message(request, messages.INFO, "User successfully added")
    return redirect(viewUsers)


def saveCitizen(request):
    if request.method == "POST":
        citizen = Person.objects.filter(national_id=request.POST["national_id"])
        if citizen.exists():
            messages.error(request, "Citizen with that National ID already exists")
            return redirect(addCitizen)
        else:
            myfile = request.FILES["image"]
            fs = FileSystemStorage()
            filename = fs.save(myfile.name, myfile)
            uploaded_file_url = fs.url(filename)

            person = Person.objects.create(
                name=request.POST["name"],
                national_id=request.POST["national_id"],
                address=request.POST["address"],
                picture=uploaded_file_url[1:],
                status="Free",
            )
            person.save()
            messages.add_message(request, messages.INFO, "Citizen successfully added")
            return redirect(viewCitizens)


def viewCitizens(request):
    citizens = Person.objects.all()
    context = {"citizens": citizens}
    return render(request, "home/view_citizenz.html", context)


def wantedCitizen(request, citizen_id):
    wanted = Person.objects.filter(pk=citizen_id).update(status="Wanted")
    if wanted:
        # person = Person.objects.filter(pk=citizen_id)
        # thief = ThiefLocation.objects.create(
        #     name=person.get().name,
        #     national_id=person.get().national_id,
        #     address=person.get().address,
        #     picture=person.get().picture,
        #     status='Wanted',
        #     latitude='20202020',
        #     longitude='040404040'
        # )
        # thief.save()
        messages.add_message(
            request, messages.INFO, "User successfully changed status to wanted"
        )
    else:
        messages.error(request, "Failed to change the status of the citizen")
    return redirect(viewCitizens)


def freeCitizen(request, citizen_id):
    free = Person.objects.filter(pk=citizen_id).update(status="Free")
    if free:
        messages.add_message(
            request,
            messages.INFO,
            "User successfully changed status to Found and Free from Search",
        )
    else:
        messages.error(request, "Failed to change the status of the citizen")
    return redirect(viewCitizens)


def spottedCriminals(request):
    thiefs = ThiefLocation.objects.filter(status="Wanted")
    context = {"thiefs": thiefs}
    return render(request, "home/spotted_thiefs.html", context)


def foundThief(request, thief_id):
    free = ThiefLocation.objects.filter(pk=thief_id)
    freectzn = ThiefLocation.objects.filter(national_id=free.get().national_id).update(
        status="Found"
    )
    if freectzn:
        thief = ThiefLocation.objects.filter(pk=thief_id)
        free = Person.objects.filter(national_id=thief.get().national_id).update(
            status="Found"
        )
        if free:
            messages.add_message(
                request, messages.INFO, "Thief updated to found, congratulations"
            )
        else:
            messages.error(request, "Failed to update thief status")
    return redirect(spottedCriminals)


def viewThiefLocation(request, thief_id):
    thief = ThiefLocation.objects.filter(pk=thief_id)
    context = {"thief": thief}
    return render(request, "home/loc.html", context)


def viewReports(request):
    return render(request, "home/reports.html")


def login(request):
    if User.objects.filter(email=request.POST["login_email"]).exists():
        user = User.objects.filter(email=request.POST["login_email"])[0]
        # hashed = bcrypt.hashpw(request.POST['login_password'], bcrypt.gensalt())
        if user:
            request.session["id"] = user.id
            request.session["name"] = user.first_name
            request.session["surname"] = user.last_name
            messages.add_message(
                request,
                messages.INFO,
                "Welcome to criminal detection system "
                + user.first_name
                + " "
                + user.last_name,
            )
            return redirect(success)
        else:
            messages.error(request, "Oops, Wrong password, please try a diffrerent one")
            return redirect("/")
    else:
        messages.error(request, "Oops, That police ID do not exist")
        return redirect("/")


def success(request):
    user = User.objects.get(id=request.session["id"])
    context = {"user": user}
    return render(request, "home/welcome.html", context)


from urllib.parse import unquote

def detectImage(request):
    # This is an example of running face recognition on a single image
    # and drawing a box around each person that was identified.

    # upload image
    if request.method == "POST" and request.FILES.get("image"):
        myfile = request.FILES["image"]
        fs = FileSystemStorage()
        # Clean the filename to remove any problematic characters
        filename = fs.save(myfile.name, myfile)
        uploaded_file_url = fs.url(filename)
        # Decode URL-encoded characters in the file path
        uploaded_file_path = unquote(uploaded_file_url[1:])  # Remove leading slash and decode URL encoding
        # person=Person.objects.create(name="Swimoz",user_id="1",address="2020 Nehosho",picture=uploaded_file_path)
        # person.save()

    images = []
    encodings = []
    names = []
    files = []

    prsn = Person.objects.all()
    for crime in prsn:
        images.append(crime.name + "_image")
        encodings.append(crime.name + "_face_encoding")
        files.append(crime.picture)
        names.append(crime.name + " " + crime.address)

    for i in range(0, len(images)):
        images[i] = face_recognition.load_image_file(files[i])
        encodings[i] = face_recognition.face_encodings(images[i])[0]

    # Create arrays of known face encodings and their names
    known_face_encodings = encodings
    known_face_names = names

    # Load an image with an unknown face
    try:
        unknown_image = face_recognition.load_image_file(uploaded_file_path)
    except Exception as e:
        messages.error(request, f"Error loading image: {str(e)}")
        return redirect('home')  # or wherever you want to redirect on error

    # Find all the faces and face encodings in the unknown image
    face_locations = face_recognition.face_locations(unknown_image)
    face_encodings = face_recognition.face_encodings(unknown_image, face_locations)

    # Convert the image to a PIL-format image so that we can draw on top of it with the Pillow library
    # See http://pillow.readthedocs.io/ for more about PIL/Pillow
    pil_image = Image.fromarray(unknown_image)
    # Create a Pillow ImageDraw Draw instance to draw with
    draw = ImageDraw.Draw(pil_image)

    # Loop through each face found in the unknown image
    for (top, right, bottom, left), face_encoding in zip(
        face_locations, face_encodings
    ):
        # See if the face is a match for the known face(s)
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)

        name = "Unknown"

        # If a match was found in known_face_encodings, just use the first one.
        # if True in matches:
        #     first_match_index = matches.index(True)
        #     name = known_face_names[first_match_index]

        # Or instead, use the known face with the smallest distance to the new face
        face_distances = face_recognition.face_distance(
            known_face_encodings, face_encoding
        )
        best_match_index = np.argmin(face_distances)
        if matches[best_match_index]:
            name = known_face_names[best_match_index]

        # Draw a box around the face using the Pillow module
        draw.rectangle(((left, top), (right, bottom)), outline=(0, 0, 255))

        # Draw a label with a name below the face
        text_width, text_height = draw.textsize(name)
        draw.rectangle(
            ((left, bottom - text_height - 10), (right, bottom)),
            fill=(0, 0, 255),
            outline=(0, 0, 255),
        )
        draw.text((left + 6, bottom - text_height - 5), name, fill=(255, 255, 255, 255))

    # Remove the drawing library from memory as per the Pillow docs
    del draw

    # Display the resulting image
    pil_image.show()
    return redirect("/success")

    # You can also save a copy of the new image to disk if you want by uncommenting this line
    # pil_image.save("image_with_boxes.jpg")9

def detectWithWebcam(request):
    # Get a reference to webcam #0 (the default one)
    video_capture = cv2.VideoCapture(0)

    # Load a sample picture and learn how to recognize it.
    images = []
    encodings = []
    names = []
    files = []
    nationalIds = []

    prsn = Person.objects.all()
    for crime in prsn:
        images.append(crime.name + "_image")
        encodings.append(crime.name + "_face_encoding")
        files.append(crime.picture)
        # Modify here to include only the name
        names.append(crime.name)
        nationalIds.append(crime.national_id)

    for i in range(0, len(images)):
        images[i] = face_recognition.load_image_file(files[i])
        encodings[i] = face_recognition.face_encodings(images[i])[0]

    # Create arrays of known face encodings and their names
    known_face_encodings = encodings
    known_face_names = names
    n_id = nationalIds

    # Global variables to store the coordinates of the selected region
    top_left = (0, 0)
    bottom_right = (0, 0)
    selected = False
    name = "Unknown"  # Initialize the name variable

    def mouse_callback(event, x, y, flags, params):
        nonlocal top_left, bottom_right, selected

        if event == cv2.EVENT_LBUTTONDOWN:
            top_left = (x, y)
            selected = False
        elif event == cv2.EVENT_LBUTTONUP:
            bottom_right = (x, y)
            selected = True

    # Create a window and set the mouse callback function
    cv2.namedWindow("Select Area")
    cv2.setMouseCallback("Select Area", mouse_callback)

    while True:
        # Grab a single frame of video
        ret, frame = video_capture.read()

        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_frame = frame[:, :, ::-1]

        # Find all the faces and face enqcodings in the frame of video
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        frame_count = 0
        # Loop through each face in this frame of video
        for (top, right, bottom, left), face_encoding in zip(
            face_locations, face_encodings
        ):
            frame_count += 1
            # See if the face is a match for the known face(s)
            matches = face_recognition.compare_faces(
                known_face_encodings, face_encoding
            )

            name = "Unknown"
            color = (0, 255, 0)  # color for unknown faces i.e green

            # If a match was found in known_face_encodings, just use the first one.
            if True in matches:
                first_match_index = matches.index(True)
                name = known_face_names[first_match_index]
                color = (0, 0, 255)  # color for known faces red without blinking

                # Draw a blinking rectangle around the known faces
                if True in matches and frame_count % 10 < 5:
                    cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                else:
                    # draw rectangle aroud the face for unknown faces
                    cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
                
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255,255,255), 1)
            elif selected:

                continue
            if name == "Unknown" and not selected:
                cv2.rectangle(frame, (left, top), (right,bottom), color, 2)
                cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255,255,255), 1)



            # Or instead, use the known face with the smallest distance to the new face
            # face_distances = face_recognition.face_distance(
            #     known_face_encodings, face_encoding
            # )
            # best_match_index = np.argmin(face_distances)
            # if matches[best_match_index]:
            #     name = known_face_names[best_match_index]

            # Draw a box around the face
            # cv2.rectangle(frame, (left, top), (right, bottom), color, 2)

            # # Draw a label with a name below the face
            # cv2.rectangle(
            #     frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED
            # )
            # font = cv2.FONT_HERSHEY_DUPLEX
            # cv2.putText(
            #     frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1
            # )

        # If an unknown face is detected and a region is selected, capture the selected area
        if name == "Unknown" and selected:
            # Draw rectangle around the selected area
            cv2.rectangle(frame, top_left, bottom_right, (0, 255, 0), 2)
            

            # Save the selected area when 's' is pressed
            if cv2.waitKey(1) & 0xFF == ord("s"):
                roi = frame[top_left[1]:bottom_right[1], top_left[0]:bottom_right[0]]
                cv2.imwrite("selected_area.jpg", roi)
                print("Selected area saved as 'selected_area.jpg'")
                selected = False
                video_capture.release()  # Release webcam resources
                cv2.destroyAllWindows()  # Close OpenCV windows
                return redirect("/add_citizen")
            # break  # Exit the loop after saving the image

        # Display the resulting image
        cv2.imshow("Select Area", frame)

        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # Release handle to the webcam
    video_capture.release()
    cv2.destroyAllWindows()

    return redirect("/success")






