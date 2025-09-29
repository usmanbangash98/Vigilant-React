from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import logout
from django.contrib import messages
from django.shortcuts import get_object_or_404
import json
import bcrypt
from main.models import User, Person, ThiefLocation, DetectionEvent, DetectionMatch
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
    import time
    start_time = time.time()
    
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

        # Calculate processing time and statistics
        processing_time = time.time() - start_time
        total_faces = len(detections)
        known_faces = sum(1 for d in detections if d['name'] != 'Unknown')
        unknown_faces = total_faces - known_faces
        
        # Get current user ID from session
        user_id = request.session.get("id")
        
        # Create detection event record
        # Store the URL path for easier access from frontend
        image_url_path = uploaded_url  # Keep the full URL path with /media/
        detection_event = DetectionEvent.objects.create(
            image_name=uploaded.name,
            image_path=image_url_path,
            total_faces_detected=total_faces,
            known_faces_matched=known_faces,
            unknown_faces_detected=unknown_faces,
            processing_time_seconds=processing_time,
            detection_method='image_upload',
            user_id=user_id
        )
        
        # Create detection match records for each face
        for detection in detections:
            matched_person = None
            if detection['name'] != 'Unknown':
                # Find the person by name (you might want to improve this matching logic)
                try:
                    matched_person = Person.objects.filter(name__icontains=detection['name'].split()[0]).first()
                except:
                    pass
            
            DetectionMatch.objects.create(
                detection_event=detection_event,
                matched_person=matched_person,
                confidence_score=detection['confidence'],
                is_match=(detection['name'] != 'Unknown'),
                face_top=detection['box'][0],
                face_right=detection['box'][1],
                face_bottom=detection['box'][2],
                face_left=detection['box'][3]
            )
        
        # Return the saved image URL so the frontend can render it and overlay boxes
        return JsonResponse({
            "success": True, 
            "detections": detections, 
            "image_url": uploaded_url,
            "statistics": {
                "total_faces": total_faces,
                "known_faces": known_faces,
                "unknown_faces": unknown_faces,
                "processing_time": round(processing_time, 2)
            }
        })
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


@require_http_methods(["GET"])
def api_reports_statistics(request):
    try:
        from django.db.models import Sum, Avg, Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Get date range (default to last 30 days)
        days = int(request.GET.get('days', 30))
        today = timezone.now().date()
        start_date = timezone.make_aware(timezone.datetime.combine(today - timedelta(days=days-1), timezone.datetime.min.time()))
        end_date = timezone.now()
        
        # Overall statistics
        total_detections = DetectionEvent.objects.filter(created_at__gte=start_date).count()
        total_faces_detected = DetectionEvent.objects.filter(created_at__gte=start_date).aggregate(
            total=Sum('total_faces_detected'))['total'] or 0
        total_known_matches = DetectionEvent.objects.filter(created_at__gte=start_date).aggregate(
            total=Sum('known_faces_matched'))['total'] or 0
        total_unknown_faces = DetectionEvent.objects.filter(created_at__gte=start_date).aggregate(
            total=Sum('unknown_faces_detected'))['total'] or 0
        avg_processing_time = DetectionEvent.objects.filter(created_at__gte=start_date).aggregate(
            avg=Avg('processing_time_seconds'))['avg'] or 0
        
        # Daily statistics for charts
        daily_stats = []
        for i in range(days):
            current_date = today - timedelta(days=days-1-i)
            date_start = timezone.make_aware(timezone.datetime.combine(current_date, timezone.datetime.min.time()))
            date_end = timezone.make_aware(timezone.datetime.combine(current_date, timezone.datetime.max.time()))
            
            day_detections = DetectionEvent.objects.filter(
                created_at__gte=date_start,
                created_at__lte=date_end
            ).aggregate(
                detections=Count('id'),
                faces=Sum('total_faces_detected'),
                known=Sum('known_faces_matched'),
                unknown=Sum('unknown_faces_detected'),
                avg_time=Avg('processing_time_seconds')
            )
            
            daily_stats.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'detections': day_detections['detections'] or 0,
                'total_faces': day_detections['faces'] or 0,
                'known_faces': day_detections['known'] or 0,
                'unknown_faces': day_detections['unknown'] or 0,
                'avg_processing_time': round(day_detections['avg_time'] or 0, 2)
            })
        
        # Top matched persons
        top_matches = DetectionMatch.objects.filter(
            detection_event__created_at__gte=start_date,
            is_match=True,
            matched_person__isnull=False
        ).values(
            'matched_person__name',
            'matched_person__status'
        ).annotate(
            match_count=Count('id'),
            avg_confidence=Avg('confidence_score')
        ).order_by('-match_count')[:10]
        
        # Recent detections
        recent_detections = DetectionEvent.objects.filter(
            created_at__gte=start_date
        ).order_by('-created_at')[:20].values(
            'id', 'image_name', 'image_path', 'total_faces_detected', 
            'known_faces_matched', 'unknown_faces_detected',
            'processing_time_seconds', 'created_at'
        )
        
        return JsonResponse({
            'success': True,
            'statistics': {
                'overview': {
                    'total_detections': total_detections,
                    'total_faces_detected': total_faces_detected,
                    'total_known_matches': total_known_matches,
                    'total_unknown_faces': total_unknown_faces,
                    'avg_processing_time': round(avg_processing_time, 2),
                    'match_rate': round((total_known_matches / max(total_faces_detected, 1)) * 100, 1)
                },
                'daily_stats': daily_stats,
                'top_matches': list(top_matches),
                'recent_detections': list(recent_detections)
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def api_test_media(request):
    """Test endpoint to check media file serving"""
    import os
    from django.conf import settings
    
    try:
        # List files in media directory
        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            files = os.listdir(media_root)
            return JsonResponse({
                'success': True,
                'media_root': media_root,
                'media_url': settings.MEDIA_URL,
                'files': files[:10]  # First 10 files
            })
        else:
            return JsonResponse({
                'success': False,
                'error': f'Media directory does not exist: {media_root}'
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


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
