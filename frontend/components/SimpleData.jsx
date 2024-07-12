const SimpleData = ({getData, getPending, getError, label, refetch, children}) => {
  return (
    <div>
          {getPending ? (
            <div>{`Chargement ${label}...`}</div>
          ) : (getError ?
            (
              <div>{`Erreur chargement ${label}...`}</div>
            ) : (
              <p className="text-[#706C61]">{`${label} ${getData}`} {children}</p>
            )
          )}
        </div>
  )
}

export default SimpleData