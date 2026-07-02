-- 允许登录用户查看所有人资料（用于人员筛选与列表展示）
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- 允许登录用户查看他人已发布的周报（自己的周报仍由原策略覆盖，含草稿）
create policy "Authenticated users can view published reports"
  on public.weekly_reports for select
  to authenticated
  using (status = 'published');
