-- Drop old tables that are being replaced
DROP TABLE IF EXISTS public.scores CASCADE;
DROP TABLE IF EXISTS public.component_cpmk CASCADE;
DROP TABLE IF EXISTS public.components CASCADE;
DROP TABLE IF EXISTS public.cpmk CASCADE;

-- Prodi
CREATE TABLE public.prodi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text NOT NULL UNIQUE,
  nama text NOT NULL,
  jenjang text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prodi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prodi select all" ON public.prodi FOR SELECT TO authenticated USING (true);
CREATE POLICY "prodi admin manage" ON public.prodi FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CPL (per prodi)
CREATE TABLE public.cpl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prodi_id uuid NOT NULL REFERENCES public.prodi(id) ON DELETE CASCADE,
  kode text NOT NULL,
  deskripsi text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prodi_id, kode)
);
ALTER TABLE public.cpl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpl select all" ON public.cpl FOR SELECT TO authenticated USING (true);
CREATE POLICY "cpl admin manage" ON public.cpl FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CPMK (per prodi, milik CPL, punya bobot dalam CPL)
CREATE TABLE public.cpmk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpl_id uuid NOT NULL REFERENCES public.cpl(id) ON DELETE CASCADE,
  kode text NOT NULL,
  deskripsi text NOT NULL DEFAULT '',
  bobot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cpl_id, kode)
);
ALTER TABLE public.cpmk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpmk select all" ON public.cpmk FOR SELECT TO authenticated USING (true);
CREATE POLICY "cpmk admin manage" ON public.cpmk FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sub-CPMK master (milik CPMK, punya bobot dalam CPMK)
CREATE TABLE public.sub_cpmk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpmk_id uuid NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
  kode text NOT NULL,
  deskripsi text NOT NULL DEFAULT '',
  bobot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cpmk_id, kode)
);
ALTER TABLE public.sub_cpmk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_cpmk select all" ON public.sub_cpmk FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_cpmk admin manage" ON public.sub_cpmk FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tambahkan FK prodi pada courses (kolom prodi text lama tetap ada untuk backward compat)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prodi_id uuid REFERENCES public.prodi(id) ON DELETE SET NULL;

-- CPL aktif per matakuliah (dosen memilih, dengan bobot dalam matakuliah)
CREATE TABLE public.course_cpl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  cpl_id uuid NOT NULL REFERENCES public.cpl(id) ON DELETE CASCADE,
  bobot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, cpl_id)
);
ALTER TABLE public.course_cpl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_cpl all" ON public.course_cpl FOR ALL TO authenticated
  USING (public.owns_course(course_id))
  WITH CHECK (public.owns_course(course_id));

-- Sub-CPMK aktif per matakuliah (dipilih dosen)
CREATE TABLE public.course_sub_cpmk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sub_cpmk_id uuid NOT NULL REFERENCES public.sub_cpmk(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, sub_cpmk_id)
);
ALTER TABLE public.course_sub_cpmk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_sub_cpmk all" ON public.course_sub_cpmk FOR ALL TO authenticated
  USING (public.owns_course(course_id))
  WITH CHECK (public.owns_course(course_id));

-- Nilai per Sub-CPMK per mahasiswa per matakuliah
CREATE TABLE public.sub_cpmk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  sub_cpmk_id uuid NOT NULL REFERENCES public.sub_cpmk(id) ON DELETE CASCADE,
  nilai numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, sub_cpmk_id)
);
ALTER TABLE public.sub_cpmk_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_cpmk_scores all" ON public.sub_cpmk_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND public.owns_course(e.course_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND public.owns_course(e.course_id)));

CREATE TRIGGER trg_sub_cpmk_scores_touch BEFORE UPDATE ON public.sub_cpmk_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();