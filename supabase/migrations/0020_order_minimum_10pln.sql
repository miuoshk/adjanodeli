-- Minimum zamówienia: 10,00 zł (1000 gr), także bez rabatu.

do $patch$
declare
  src text;
begin
  src := pg_get_functiondef('public.validate_discount_code(text, int, uuid)'::regprocedure);
  if position('coalesce(p_subtotal, 0) - v_discount < 200' in src) = 0 then
    raise exception 'unexpected validate_discount_code body';
  end if;
  src := replace(
    src,
    'coalesce(p_subtotal, 0) - v_discount < 200',
    'coalesce(p_subtotal, 0) - v_discount < 1000'
  );
  src := replace(
    src,
    'Po rabacie zamówienie musi mieć min. 2,00 zł. Dodaj jeszcze produkt.',
    'Po rabacie zamówienie musi mieć min. 10,00 zł. Dodaj jeszcze produkt.'
  );
  execute src;

  src := pg_get_functiondef('public.create_order(uuid, date, jsonb, text, jsonb, jsonb)'::regprocedure);
  if position('if v_discount > 0 and v_total < 200 then' in src) = 0 then
    raise exception 'unexpected create_order body';
  end if;
  src := replace(
    src,
    'if v_discount > 0 and v_total < 200 then',
    'if v_total < 1000 then'
  );
  execute src;
end
$patch$;
