from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import logout
from django.contrib import messages
from django.shortcuts import get_object_or_404
import json
import bcrypt
from main.models import User, Person, ThiefLocation
import face_recognition
import numpy as np
from django.core.files.storage import FileSystemStorage
from urllib.parse import unquote


@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    try:
        # Accept both sets of parameter names (Django template and React)
        email = request.POST.get('username') or request.POST.get('login_email')
        password = request.POST.get('password') or request.POST.get('login_password')
        
        if not email or not password:
            return JsonResponse({
                'success': False,
                'error': 'Email and password are required'
            }, status=400)
        
        if User.objects.filter(email=email).exists():
            user = User.objects.filter(email=email)[0]
            if user:
                request.session["id"] = user.id
                request.session["name"] = user.first_name
                request.session["surname"] = user.last_name
                
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'name': user.first_name,
                        'surname': user.last_name,
                        'email': user.email
                    },
                    'redirect': '/dashboard'  # Add redirect URL
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid password'
                }, status=400)
        else:
            return JsonResponse({
                'success': False,
                'error': 'User not found'
            }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    logout(request)
    return JsonResponse({'success': True})


@require_http_methods(["GET"])
def api_current_user(request):
    user_id = request.session.get("id")
    if not user_id:
        return JsonResponse(
            {
                "success": False,
                "error": "Not authenticated",
            },
            status=401,
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "error": "User not found",
            },
            status=404,
        )

    return JsonResponse(
        {
            "success": True,
            "user": {
                "id": user.id,
                "name": user.first_name,
                "surname": user.last_name,
                "email": user.email,
            },
        }
    )


@require_http_methods(["GET"])
def api_users(request):
    try:
        users = User.objects.all().values(
            'id', 'first_name', 'last_name', 'email', 'created_at', 'updated_at'
        )
        return JsonResponse({
            'success': True,
            'users': list(users)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def api_citizens(request):
    try:
        citizens = Person.objects.all().values(
            'id', 'name', 'national_id', 'address', 'picture', 'status', 'created_at', 'updated_at'
        )
        return JsonResponse({
            'success': True,
            'citizens': list(citizens)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def api_spotted_criminals(request):
    try:
        criminals = ThiefLocation.objects.filter(status="Wanted").values(
            'id', 'name', 'national_id', 'address', 'picture', 'status', 
            'latitude', 'longitude', 'created_at', 'updated_at'
        )
        return JsonResponse({
            'success': True,
            'criminals': list(criminals)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def api_detect_image(request):
    try:
        # Accept multipart upload with field 'image'
        if request.method != "POST":
            return JsonResponse({"success": False, "error": "POST required"}, status=405)

        if "image" not in request.FILES:
            return JsonResponse({"success": False, "error": "No image provided"}, status=400)

        uploaded = request.FILES["image"]
        fs = FileSystemStorage()
        filename = fs.save(uploaded.name, uploaded)
        uploaded_url = fs.url(filename)
        # Convert to filesystem path (remove leading slash if present)
        uploaded_path = unquote(uploaded_url[1:]) if uploaded_url.startswith("/") else unquote(uploaded_url)

        # Load known images from Person records
        persons = Person.objects.all()
        known_encodings = []
        known_names = []
        known_status = []
        known_nid = []

        for p in persons:
            try:
                img_path = p.picture
                if not img_path:
                    continue
                # face_recognition.load_image_file accepts file path
                img = face_recognition.load_image_file(img_path)
                encs = face_recognition.face_encodings(img)
                if len(encs) == 0:
                    continue
                known_encodings.append(encs[0])
                known_names.append(p.name)
                known_status.append(p.status)
                known_nid.append(p.national_id)
            except Exception:
                # skip problematic person images
                continue

        # Load and analyze uploaded image
        try:
            unknown_image = face_recognition.load_image_file(uploaded_path)
        except Exception as e:
            return JsonResponse({"success": False, "error": f"Failed to load uploaded image: {str(e)}"}, status=400)

        face_locations = face_recognition.face_locations(unknown_image)
        face_encodings = face_recognition.face_encodings(unknown_image, face_locations)

        detections = []

        # Loop by index so we can attach the corresponding bounding box
        for i, face_encoding in enumerate(face_encodings):
            top, right, bottom, left = face_locations[i]

            if len(known_encodings) == 0:
                detections.append({
                    "name": "Unknown",
                    "confidence": 0.0,
                    "status": "Unknown",
                    "national_id": None,
                    "box": [int(top), int(right), int(bottom), int(left)],
                })
                continue

            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            face_distances = face_recognition.face_distance(known_encodings, face_encoding)

            best_index = int(np.argmin(face_distances))
            best_distance = float(face_distances[best_index])
            confidence = round(max(0.0, (1.0 - best_distance)) * 100.0, 2)

            if matches[best_index]:
                detections.append({
                    "name": known_names[best_index],
                    "confidence": confidence,
                    "status": known_status[best_index] if known_status[best_index] else "Unknown",
                    "national_id": known_nid[best_index],
                    "box": [int(top), int(right), int(bottom), int(left)],
                })
            else:
                detections.append({
                    "name": "Unknown",
                    "confidence": confidence,
                    "status": "Unknown",
                    "national_id": None,
                    "box": [int(top), int(right), int(bottom), int(left)],
                })

        # Return the saved image URL so the frontend can render it and overlay boxes
        return JsonResponse({"success": True, "detections": detections, "image_url": uploaded_url})
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_add_citizen(request):
    try:
        # Get form data
        name = request.POST.get('name')
        national_id = request.POST.get('national_id')
        address = request.POST.get('address')
        image = request.FILES.get('image')
        
        if not all([name, national_id, address, image]):
            return JsonResponse({
                'success': False,
                'error': 'All fields (name, national_id, address, image) are required'
            }, status=400)
        
        # Check if citizen with this national_id already exists
        if Person.objects.filter(national_id=national_id).exists():
            return JsonResponse({
                'success': False,
                'error': 'Citizen with that National ID already exists'
            }, status=400)
        
        # Save the uploaded image
        fs = FileSystemStorage()
        filename = fs.save(image.name, image)
        uploaded_file_url = fs.url(filename)
        
        # Create the person record
        person = Person.objects.create(
            name=name,
            national_id=national_id,
            address=address,
            picture=uploaded_file_url[1:],  # Remove leading slash
            status="Free",
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Citizen successfully added',
            'citizen': {
                'id': person.id,
                'name': person.name,
                'national_id': person.national_id,
                'address': person.address,
                'picture': person.picture,
                'status': person.status
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_update_citizen_status(request, citizen_id, action):
    try:
        citizen = get_object_or_404(Person, pk=citizen_id)
        
        if action == 'wanted':
            citizen.status = 'Wanted'
        elif action == 'free':
            citizen.status = 'Free'
        
        citizen.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Status updated to {citizen.status}'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
