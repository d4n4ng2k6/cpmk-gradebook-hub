-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'dosen');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  nidn TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger: auto profile + default 'dosen' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dosen');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_mk TEXT NOT NULL,
  nama_mk TEXT NOT NULL,
  kelas TEXT,
  tahun_ajaran TEXT,
  semester TEXT,
  prodi TEXT,
  jenjang TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CPMK
CREATE TABLE public.cpmk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  kode TEXT NOT NULL,
  deskripsi TEXT NOT NULL DEFAULT '',
  bobot NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Components (Tugas/UTS/UAS dst)
CREATE TABLE public.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  bobot NUMERIC(6,2) NOT NULL DEFAULT 0,
  urutan INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mapping komponen -> CPMK (kontribusi % komponen ke CPMK tsb)
CREATE TABLE public.component_cpmk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  cpmk_id UUID NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
  kontribusi NUMERIC(6,2) NOT NULL DEFAULT 0,
  UNIQUE(component_id, cpmk_id)
);

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npm TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrollment
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Scores per komponen
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  nilai NUMERIC(6,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, component_id)
);
CREATE TRIGGER trg_scores_updated BEFORE UPDATE ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpmk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_cpmk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- user_roles policies (read only for self/admin; only admin can modify)
CREATE POLICY "view own role" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- courses: dosen owns; admin all
CREATE POLICY "courses select" ON public.courses FOR SELECT TO authenticated
USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "courses insert" ON public.courses FOR INSERT TO authenticated
WITH CHECK (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "courses update" ON public.courses FOR UPDATE TO authenticated
USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "courses delete" ON public.courses FOR DELETE TO authenticated
USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- helper: is_course_owner
CREATE OR REPLACE FUNCTION public.owns_course(_course_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = _course_id AND (c.lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
$$;

-- generic course-child policies
CREATE POLICY "cpmk all" ON public.cpmk FOR ALL TO authenticated
USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));

CREATE POLICY "components all" ON public.components FOR ALL TO authenticated
USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));

CREATE POLICY "component_cpmk all" ON public.component_cpmk FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.components co WHERE co.id = component_id AND public.owns_course(co.course_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.components co WHERE co.id = component_id AND public.owns_course(co.course_id)));

-- students: visible to any authenticated (shared catalogue), write by authenticated
CREATE POLICY "students select" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "students insert" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "students update" ON public.students FOR UPDATE TO authenticated USING (true);

CREATE POLICY "enrollments all" ON public.enrollments FOR ALL TO authenticated
USING (public.owns_course(course_id)) WITH CHECK (public.owns_course(course_id));

CREATE POLICY "scores all" ON public.scores FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND public.owns_course(e.course_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND public.owns_course(e.course_id)));